export type OCRResult = {
  requesterName: string | null;
  requestDate: string | null;
  additionalDetails: string | null;
};

type ChatCompletionResponse = {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
};

const OCR_PROMPT = `อ่านเอกสารใบอนุญาตนี้แล้วดึงข้อมูลต่อไปนี้
ตอบเป็น JSON เท่านั้น ไม่ต้องมี markdown code block หรือข้อความอื่นใด

{
  "requesterName": "ชื่อ-นามสกุล ของผู้ขอยืม (เช่น นางสาวสมหญิง ใจดี) หรือ null ถ้าไม่พบ",
  "requestDate": "วันที่ในเอกสาร เป็นปีคริสต์ศักราช รูปแบบ YYYY-MM-DD (เช่น 15 พฤษภาคม 2569 → 2026-05-15, 1 มกราคม 2568 → 2025-01-01) หรือ null ถ้าไม่พบ",
  "additionalDetails": "ชื่อเครื่องมือวิจัยที่ขอยืม และจุดประสงค์การยืม รวมเป็นข้อความเดียว หรือข้อมูลอื่นๆ ที่สำคัญจากเอกสาร หรือ null ถ้าไม่พบ"
}

สำคัญมาก: ถ้าวันที่เป็นปีพุทธศักราช (พ.ศ.) ให้ลบ 543 เพื่อแปลงเป็นปีคริสต์ศักราช (ค.ศ.)`;

export async function extractLicenseData(
  pdfBuffer: Buffer,
): Promise<OCRResult> {
  const baseURL = process.env.TYPHOON_BASE_URL;
  const apiKey = process.env.TYPHOON_API_KEY;
  const model = process.env.TYPHOON_OCR_MODEL || "typhoon-ocr";

  if (!baseURL || !apiKey) {
    throw new Error(
      "ไม่ได้ตั้งค่า TYPHOON_BASE_URL หรือ TYPHOON_API_KEY",
    );
  }

  const { convertPdfToImage } = await import("./pdf-to-image");
  const imageBuffer = convertPdfToImage(pdfBuffer);
  const base64 = imageBuffer.toString("base64");
  const dataUrl = `data:image/png;base64,${base64}`;

  const endpoint = `${baseURL.replace(/\/+$/, "")}/v1/chat/completions`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: dataUrl } },
            { type: "text", text: OCR_PROMPT },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
      top_p: 0.6,
      repetition_penalty: 1.2,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error("[OCR] API error:", response.status, errorBody.slice(0, 500));
    throw new Error("ไม่สามารถเชื่อมต่อบริการอ่านเอกสารได้ กรุณาลองใหม่");
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    return { requesterName: null, requestDate: null, additionalDetails: null };
  }

  return parseOCRResponse(content);
}

function parseOCRResponse(content: string): OCRResult {
  const empty: OCRResult = {
    requesterName: null,
    requestDate: null,
    additionalDetails: null,
  };

  // Strip markdown code block if present
  const stripped = content
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(stripped);
    return {
      requesterName: typeof parsed.requesterName === "string" ? parsed.requesterName : null,
      requestDate: normalizeDate(parsed.requestDate),
      additionalDetails: typeof parsed.additionalDetails === "string" ? parsed.additionalDetails : null,
    };
  } catch {
    return empty;
  }
}

const THAI_MONTHS: Record<string, number> = {
  "มกราคม": 1, "กุมภาพันธ์": 2, "มีนาคม": 3, "เมษายน": 4,
  "พฤษภาคม": 5, "มิถุนายน": 6, "กรกฎาคม": 7, "สิงหาคม": 8,
  "กันยายน": 9, "ตุลาคม": 10, "พฤศจิกายน": 11, "ธันวาคม": 12,
  "ม.ค.": 1, "ก.พ.": 2, "มี.ค.": 3, "เม.ย.": 4,
  "พ.ค.": 5, "มิ.ย.": 6, "ก.ค.": 7, "ส.ค.": 8,
  "ก.ย.": 9, "ต.ค.": 10, "พ.ย.": 11, "ธ.ค.": 12,
};

function normalizeDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const v = value.trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  // Thai date: "15 พฤษภาคม 2569" or "15 พ.ค. 2569"
  const thaiMatch = v.match(/(\d{1,2})\s+(\S+)\s+(\d{4})/);
  if (thaiMatch) {
    const day = parseInt(thaiMatch[1], 10);
    const month = THAI_MONTHS[thaiMatch[2]];
    let year = parseInt(thaiMatch[3], 10);
    if (month && year > 2400) {
      year -= 543; // Buddhist → Gregorian
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  return null;
}
