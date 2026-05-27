import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

const OCR_PROMPT = `อ่านเอกสารนี้แล้วแยกข้อมูลใส่ JSON ตามฟิลด์ด้านล่าง
ตอบเป็น JSON เท่านั้น ไม่ต้องมีคำอธิบาย ไม่ต้องมี markdown code block

{
  "requesterName": "เฉพาะชื่อ-นามสกุลของผู้ขอเท่านั้น เช่น 'นางสาวสมหญิง ใจดี' ห้ามใส่ข้อมูลอื่นปน",
  "requestDate": "วันที่ในเอกสาร แปลงเป็น YYYY-MM-DD (พ.ศ. ให้ลบ 543) เช่น 15 พฤษภาคม 2569 → 2026-05-15",
  "additionalDetails": "ข้อความที่อยู่หลังคำว่า 'จุดประสงค์การยืม' หรือ 'วัตถุประสงค์' ในเอกสาร ถ้าไม่มีให้ใส่ข้อความสำคัญอื่นๆ ที่ไม่ใช่ชื่อผู้ขอหรือชื่อเครื่องมือ"
}

ตัวอย่างคำตอบที่ถูกต้อง:
{"requesterName":"นางสาวสมหญิง ใจดี","requestDate":"2026-05-15","additionalDetails":"ใช้เป็นเครื่องมือเก็บข้อมูลในการวิจัยเพื่อวิทยานิพนธ์ เรื่อง ปัจจัยที่สัมพันธ์กับการใช้วินัยเชิงบวกของบิดามารดา"}

ถ้าไม่พบข้อมูลในฟิลด์ใด ให้ใส่ null`;

export async function extractLicenseData(
  pdfBuffer: Buffer,
): Promise<OCRResult> {
  const extractedText = extractPdfText(pdfBuffer);
  const textResult = parseTextFields(extractedText);

  if (isCompleteResult(textResult)) {
    return textResult;
  }

  const baseURL = process.env.TYPHOON_BASE_URL;
  const apiKey = process.env.TYPHOON_API_KEY;
  const model = process.env.TYPHOON_OCR_MODEL || "typhoon-ocr";

  if (!baseURL || !apiKey) {
    return textResult;
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
            {
              type: "text",
              text: `${OCR_PROMPT}

ข้อความที่ดึงได้ตรงจาก PDF (อาจตกหล่นบางส่วน ให้ใช้ประกอบกับภาพเอกสารเท่านั้น):
${extractedText || "(ไม่พบข้อความจาก PDF)"}`,
            },
          ],
        },
      ],
      max_tokens: 8192,
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
    return textResult;
  }

  return mergeOCRResults(textResult, parseOCRResponse(content));
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
    const parsed = JSON.parse(extractJSONObject(stripped));
    return {
      requesterName: normalizeName(
        pickString(parsed.requesterName, parsed.name, parsed.requester, parsed.borrowerName),
      ),
      requestDate: normalizeDate(
        pickString(parsed.requestDate, parsed.date, parsed.borrowDate, parsed.request_date),
      ),
      additionalDetails: normalizeDetails(
        pickString(
          parsed.additionalDetails,
          parsed.details,
          parsed.purpose,
          parsed.objective,
          parsed.reason,
        ),
      ),
    };
  } catch {
    return empty;
  }
}

function extractPdfText(pdfBuffer: Buffer): string {
  const id = randomUUID();
  const pdfPath = join(tmpdir(), `${id}.pdf`);

  try {
    writeFileSync(pdfPath, pdfBuffer);
    const output = execFileSync("pdftotext", [pdfPath, "-"], {
      timeout: 15000,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return normalizeWhitespace(output);
  } catch {
    return "";
  } finally {
    try {
      unlinkSync(pdfPath);
    } catch {}
  }
}

function parseTextFields(text: string): OCRResult {
  if (!text.trim()) {
    return {
      requesterName: null,
      requestDate: null,
      additionalDetails: null,
    };
  }

  return {
    requesterName: normalizeName(
      findInlineField(text, ["ชื่อผู้ขอ", "ชื่อ - นามสกุล", "ชื่อผู้ยืม"]),
    ),
    requestDate: normalizeDate(
      findInlineField(text, ["วันที่ขอ", "วันเดือนปี", "วันที่ยืม"]),
    ),
    additionalDetails: normalizeDetails(
      findBlockField(text, ["จุดประสงค์การยืม", "วัตถุประสงค์", "รายละเอียดเพิ่มเติม"], [
        "หมายเหตุ",
        "ลงชื่อ",
        "ผู้อนุมัติ",
        "เครื่องมือวิจัยที่ขอยืม",
      ]),
    ),
  };
}

function mergeOCRResults(primary: OCRResult, fallback: OCRResult): OCRResult {
  return {
    requesterName: primary.requesterName ?? fallback.requesterName,
    requestDate: primary.requestDate ?? fallback.requestDate,
    additionalDetails: primary.additionalDetails ?? fallback.additionalDetails,
  };
}

function isCompleteResult(result: OCRResult) {
  return Boolean(
    result.requesterName &&
      result.requestDate &&
      result.additionalDetails,
  );
}

function extractJSONObject(value: string) {
  const first = value.indexOf("{");
  const last = value.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return value.slice(first, last + 1);
  }
  return value;
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeWhitespace(value: string) {
  return value
    .replace(/[๐-๙]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 3664))
    .replace(/[：﹕]/g, ":")
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findInlineField(text: string, labels: string[]) {
  for (const label of labels) {
    const compactLabel = label.replace(/\s+/g, "\\s*");
    const match = text.match(
      new RegExp(`(?:^|\\n)\\s*${compactLabel}\\s*(?::)?\\s*([^\\n]+)`, "i"),
    );
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function findBlockField(text: string, labels: string[], stopLabels: string[]) {
  for (const label of labels) {
    const compactLabel = label.replace(/\s+/g, "\\s*");
    const startPattern = new RegExp(`(?:^|\\n)\\s*${compactLabel}\\s*(?::)?\\s*`, "i");
    const startMatch = startPattern.exec(text);
    if (!startMatch) continue;

    const afterStart = text.slice(startMatch.index + startMatch[0].length);
    const stopPattern = new RegExp(
      `\\n\\s*(?:${stopLabels.map((item) => item.replace(/\s+/g, "\\s*")).join("|")})\\s*(?::)?`,
      "i",
    );
    const stopMatch = stopPattern.exec(afterStart);
    const value = (stopMatch
      ? afterStart.slice(0, stopMatch.index)
      : afterStart
    ).trim();

    if (value) return value;
  }
  return null;
}

function normalizeName(value: string | null) {
  if (!value) return null;

  return value
    .replace(/\s+/g, " ")
    .replace(/^(ชื่อผู้ขอ|ชื่อผู้ยืม)\s*/i, "")
    .replace(/\b(รหัสนักศึกษา|สาขา|วันที่ขอ|เครื่องมือวิจัยที่ขอยืม|จุดประสงค์การยืม)\b.*$/i, "")
    .replace(/^[\-: ]+/, "")
    .replace(/[,.]+$/, "")
    .trim() || null;
}

function normalizeDetails(value: string | null) {
  if (!value) return null;

  return value
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[-: ]+/, "")
    .replace(/\s*(หมายเหตุ|ลงชื่อผู้ขอ|ผู้อนุมัติ)\s*:.*$/i, "")
    .trim() || null;
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
  const v = value
    .trim()
    .replace(/[๐-๙]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 3664))
    .replace(/[/.]/g, "-")
    .replace(/\s+/g, " ");

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  const isoLike = v.match(/^(\d{1,4})-(\d{1,2})-(\d{1,4})$/);
  if (isoLike) {
    let year = parseInt(isoLike[1], 10);
    const month = parseInt(isoLike[2], 10);
    const day = parseInt(isoLike[3], 10);

    if (year < 1000) {
      year = day;
    }
    if (year > 2400) year -= 543;
    if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

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

  const dmyMatch = v.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);
    if (year > 2400) year -= 543;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  return null;
}
