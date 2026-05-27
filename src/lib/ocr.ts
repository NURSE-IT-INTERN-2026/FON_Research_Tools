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

const OCR_PROMPT = `วิเคราะห์เอกสารใบอนุญาตนี้และดึงข้อมูลที่สำคัญ
ตอบเป็น JSON เท่านั้น ไม่ต้องมี markdown code block หรือข้อความอื่นใด:
{
  "requesterName": "ชื่อ-นามสกุล ของผู้ขอยืม หรือ null ถ้าไม่พบ",
  "requestDate": "วันที่ในเอกสาร รูปแบบ YYYY-MM-DD หรือ null ถ้าไม่พบ",
  "additionalDetails": "ข้อมูลเพิ่มเติมที่สำคัญจากเอกสาร เช่น ชื่อเครื่องมือวิจัย จุดประสงค์การยืม หรือ null ถ้าไม่พบ"
}`;

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

  const base64 = pdfBuffer.toString("base64");
  const dataUrl = `data:application/pdf;base64,${base64}`;

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
      requestDate: typeof parsed.requestDate === "string" ? parsed.requestDate : null,
      additionalDetails: typeof parsed.additionalDetails === "string" ? parsed.additionalDetails : null,
    };
  } catch {
    return empty;
  }
}
