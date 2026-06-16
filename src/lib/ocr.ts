import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type OCRResult = {
  requesterName: string | null;
  requestDate: string | null;
  source: string | null;
  ownerName: string | null;
  additionalDetails: string | null;
};

type ChatCompletionResponse = {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
};

const OCR_PROMPT = `คุณคือตัวสกัดข้อมูลจากเอกสาร PDF ภาษาไทย
อ่านเอกสารและสกัดข้อมูลเป็น JSON ตามกฎด้านล่าง

กฎการสกัด:
- requesterName: ชื่อ-นามสกุล พร้อมคำนำหน้า (นาย/นางสาว/นาง/น.ส.) ของ "บุคคลที่ขอใช้" เครื่องมือวิจัย
  ต้องเป็นชื่อบุคคลจริงที่เริ่มต้นด้วยคำนำหน้าไทยเสมอ ห้ามเป็นชื่อหน่วยงาน/องค์กร/ที่อยู่
  มักอยู่หลังคำว่า "ตามที่..." ในจดหมายราชการ หรือหลังคำว่า "ชื่อผู้ขอ" ในแบบฟอร์ม
  ไม่รวมตำแหน่ง สังกัด จังหวัด หรือรายละเอียดอื่นใด
- requestDate: วันที่บนเอกสาร ในรูปแบบ YYYY-MM-DD (ถ้าเป็นพ.ศ. ให้ลบ 543)
- source: ชื่อองค์กร/หน่วยงาน ที่เป็นผู้รับจดหมาย อยู่บรรทัดเดียวกับคำว่า "เรียน"
  ตัดตำแหน่งของผู้รับออก (เช่น ผู้อำนวยการ/คณบดี/หัวหน้า/รอง/ผู้ช่วย/อธิการบดี) เก็บเฉพาะชื่อสถานที่
- ownerName: ชื่อ-นามสกุล พร้อมคำนำหน้า ของ "เจ้าของเครื่องมือวิจัย"
  ดึงจากข้อความที่อยู่หลังประโยค "ใช้เครื่องมือวิจัยของ..." หรือ "เครื่องมือวิจัยของ..."
  ต้องเป็นชื่อบุคคลที่เริ่มต้นด้วยคำนำหน้าไทย ไม่ต้องมีตำแหน่ง/สังกัด/จังหวัด
- additionalDetails: ย่อหน้าที่บรรยายผู้ขอแบบเต็ม — เริ่มจาก "คำนำหน้าไทย + ชื่อผู้ขอ"
  ตามด้วยตำแหน่ง สังกัด จังหวัด และ/หรือหัวข้อวิจัย เช่น
  "นางสาวธนิฏฐา เอียดพวง ตำแหน่งพยาบาลวิชาชีพปฏิบัติการ สังกัดโรงพยาบาลศรีธัญญา กรมสุขภาพจิต
   จังหวัดนนทบุรี ซึ่งเป็นผู้วิจัย เรื่อง ... มีความประสงค์ขออนุญาตนำเครื่องมือวิจัยในวิทยานิพนธ์ของ ..."
  หยุดที่คำว่า "ลงชื่อ" / "หมายเหตุ" / "จึงเรียน" / "ขอแสดงความนับถือ"
  ถ้าเอกสารเป็นแบบฟอร์มสั้น ๆ ไม่มีบริบทเช่นนี้ ให้ใส่ null

กฎเพิ่มเติม:
- หากไม่พบข้อมูลในฟิลด์ใด ให้ใส่ null
- ตอบกลับเฉพาะ JSON เท่านั้น ห้ามมีคำอธิบาย ห้ามมี markdown code block
- ห้ามนำคำอธิบายฟิลด์จาก prompt มาเป็นคำตอบ ต้องอ่านค่าจริงจากเอกสารเท่านั้น

รูปแบบคำตอบ (ทุกฟิลด์เริ่มต้นเป็น null):
{"requesterName": null, "requestDate": null, "source": null, "ownerName": null, "additionalDetails": null}`;

export async function extractLicenseData(
  pdfBuffer: Buffer,
): Promise<OCRResult> {
  const extractedText = extractPdfText(pdfBuffer);
  const textResult = parseTextFields(extractedText);

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

  try {
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

    const apiResult = parseOCRResponse(content);

    // Prefer API result for better Thai text quality
    return {
      requesterName: apiResult.requesterName ?? textResult.requesterName,
      requestDate: apiResult.requestDate ?? textResult.requestDate,
      source: apiResult.source ?? textResult.source,
      ownerName: apiResult.ownerName ?? textResult.ownerName,
      additionalDetails: apiResult.additionalDetails ?? textResult.additionalDetails,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่สามารถ")) {
      throw error;
    }
    console.error("[OCR] Error:", error);
    return textResult;
  }
}

function parseOCRResponse(content: string): OCRResult {
  const empty: OCRResult = {
    requesterName: null,
    requestDate: null,
    source: null,
    ownerName: null,
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
        rejectInvalidName(
          rejectPromptEcho(
            pickString(parsed.requesterName, parsed.name, parsed.requester, parsed.borrowerName),
          ),
        ),
      ),
      requestDate: normalizeDate(
        rejectPromptEcho(
          pickString(parsed.requestDate, parsed.date, parsed.borrowDate, parsed.request_date),
        ),
      ),
      source: normalizeDetails(
        rejectPromptEcho(
          pickString(
            parsed.source,
            parsed.organization,
            parsed.recipient,
          ),
        ),
      ),
      ownerName: normalizeName(
        rejectInvalidName(
          rejectPromptEcho(
            pickString(parsed.ownerName, parsed.owner, parsed.instrumentOwner),
          ),
        ),
      ),
      additionalDetails: normalizeDetails(
        rejectPromptEcho(
          pickString(parsed.additionalDetails, parsed.details, parsed.description),
        ),
      ),
    };
  } catch {
    return empty;
  }
}

// Phrases from the prompt that signal the model echoed the description back
// instead of extracting real data. Treat such values as null so we fall back
// to the regex-based textResult.
const PROMPT_ECHO_MARKERS = [
  "เฉพาะชื่อ",
  "พร้อมคำนำหน้า",
  "ชื่อสถานที่",
  "ชื่อ-นามสกุลของเจ้าของ",
  "วันที่บนเอกสาร",
  "วันที่ในเอกสาร",
  "YYYY-MM-DD",
  "ผู้รับจดหมาย",
  "เจ้าของเครื่องมือวิจัย",
  "ใช้เครื่องมือวิจัยของ",
];

function rejectPromptEcho(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length >= 25 && PROMPT_ECHO_MARKERS.some((m) => trimmed.includes(m))) {
    return null;
  }
  return value;
}

// Names must belong to a person, not an organization/address. Reject anything
// that doesn't start with a Thai personal title prefix so we fall back to the
// regex-based textResult instead of trusting a wrong API answer.
const THAI_PERSON_TITLE_START = /^(นาย|นางสาว|นาง|น\.ส\.)/;

function rejectInvalidName(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!THAI_PERSON_TITLE_START.test(trimmed)) {
    return null;
  }
  return value;
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

const THAI_TITLE = "(?:นาย|นางสาว|นาง|น\\.ส\\.)";

function extractLetterName(text: string): string | null {
  // "ตามที่ <title><name> <surname>"
  const tamMatch = text.match(
    new RegExp(`ตามที่\\s+(${THAI_TITLE}\\s*\\S+\\s+\\S+)`),
  );
  if (tamMatch?.[1]) return tamMatch[1].trim();

  // "<title><name> <surname> ... ซึ่งเป็นผู้วิจัย"
  const researcherMatch = text.match(
    new RegExp(`(${THAI_TITLE}\\s*\\S+\\s+\\S+)\\s+.*ซึ่งเป็นผู้วิจัย`),
  );
  if (researcherMatch?.[1]) return researcherMatch[1].trim();

  // "อนุญาตให้ <title><name> <surname>"
  const permMatch = text.match(
    new RegExp(`อนุญาตให้\\s+(${THAI_TITLE}\\s*\\S+\\s+\\S+)`),
  );
  if (permMatch?.[1]) return permMatch[1].trim();

  return null;
}

function extractLetterDate(text: string): string | null {
  // Standalone date line: "7 พฤษภาคม 2569" (after address, before "เรื่อง")
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (/^\d{1,2}\s+\S+\s+\d{4}$/.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
}

function extractLetterRecipient(text: string): string | null {
  // Extract recipient from after "เรียน" on the same line (e.g., "เรียน คณบดี..." → "คณบดี...")
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    const match = trimmed.match(/^เรียน\s+(.+)$/);
    if (match?.[1]) {
      return match[1].replace(/\s+/g, " ").trim();
    }
  }
  return null;
}

function extractOwnerName(text: string): string | null {
  // pdftotext frequently inserts spaces between Thai characters (e.g., "เครื่ องมื อวิ จั ยของ")
  // and may push the owner's name onto the following line. Build a flexible pattern
  // that tolerates optional whitespace between every char of the keyword.
  const keyword = buildFlexiblePattern("เครื่องมือวิจัยของ");
  const title = "(?:นาย|นางสาว|นาง|น\\.ส\\.)";
  const re = new RegExp(
    `${keyword}\\s*(${title}\\s*\\S+(?:\\s+\\S+)?)`,
    "i",
  );
  const match = text.match(re);
  if (match?.[1]) {
    return match[1].replace(/\s+/g, " ").trim();
  }
  return null;
}

function buildFlexiblePattern(literal: string): string {
  return literal
    .split("")
    .map((char) => {
      if (/[.*+?^${}()|[\]\\]/.test(char)) return `\\${char}`;
      return char;
    })
    .join("\\s*");
}

// Stop markers that signal the descriptive paragraph has ended — anything from
// these keywords onward belongs to signature/closing/form-tail, not the
// description of the requester.
const DETAILS_STOP_MARKERS = [
  "ลงชื่อ",
  "หมายเหตุ",
  "จึงเรียน",
  "ขอแสดงความนับถือ",
  "เรื่องที่ขอยืม",
  "เครื่องมือวิจัยที่ขอยืม",
  "จุดประสงค์การยืม",
];

// Extract the descriptive paragraph that introduces the requester with their
// position, affiliation, and/or research title. This is the body sentence that
// follows patterns like "ตามที่ <name> <position> <affiliation> ...".
function extractAdditionalDetails(text: string, requesterName: string | null): string | null {
  if (!text.trim()) return null;

  // Strategy 1: "ตามที่ <paragraph>" — formal Thai letter opener. Capture
  // everything from after "ตามที่" up to the first stop marker or sentence end.
  const tamDet = buildFlexiblePattern("ตามที่");
  const tamRe = new RegExp(`${tamDet}\\s+(.+?)(?=(?:${DETAILS_STOP_MARKERS.join("|")})|$)`, "is");
  const tamMatch = text.match(tamRe);
  if (tamMatch?.[1]) {
    const cleaned = cleanDetailsParagraph(tamMatch[1]);
    if (cleaned && cleaned.length >= 20) return cleaned;
  }

  // Strategy 2: paragraph that starts with the requester's name (already
  // extracted) and continues with position/affiliation. Find the line that
  // contains the name + trailing context.
  if (requesterName) {
    const nameEscaped = requesterName
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\s+/g, "\\s+");
    // Look for the name followed by descriptive text on the same line or
    // spilling into subsequent lines (joined by normalizeWhitespace).
    const nameRe = new RegExp(`${nameEscaped}\\s+(.+?)(?=(?:${DETAILS_STOP_MARKERS.join("|")})|$)`, "is");
    const nameMatch = text.match(nameRe);
    if (nameMatch?.[1]) {
      const combined = `${requesterName} ${cleanDetailsParagraph(nameMatch[1])}`;
      // Require minimum length so we don't capture trivial trailing words.
      if (combined.length >= 30) return combined;
    }
  }

  return null;
}

function cleanDetailsParagraph(raw: string): string | null {
  const cleaned = raw
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[.]+$/, "")
    .trim();
  return cleaned || null;
}

function parseTextFields(text: string): OCRResult {
  if (!text.trim()) {
    return {
      requesterName: null,
      requestDate: null,
      source: null,
      ownerName: null,
      additionalDetails: null,
    };
  }

  // Try form-style patterns first
  let requesterName = normalizeName(
    findInlineField(text, ["ชื่อผู้ขอ", "ชื่อ - นามสกุล", "ชื่อผู้ยืม"]),
  );
  let requestDate = normalizeDate(
    findInlineField(text, ["วันที่ขอ", "วันเดือนปี", "วันที่ยืม"]),
  );
  let source = normalizeDetails(
    findInlineField(text, ["จากองกรค์", "จากองค์กร", "จากหน่วยงาน", "หน่วยงานต้นทาง"]),
  );
  let ownerName = normalizeName(
    findInlineField(text, ["เจ้าของเครื่องมือ", "เจ้าของเครื่องมือวิจัย", "ชื่อเจ้าของ"]),
  );

  // Fallback: letter-format patterns (จดหมายจากสำนักทะเบียน มช.)
  if (!requesterName) {
    requesterName = normalizeName(extractLetterName(text));
  }
  if (!requestDate) {
    requestDate = normalizeDate(extractLetterDate(text));
  }
  if (!source) {
    source = normalizeDetails(extractLetterRecipient(text));
  }
  if (!ownerName) {
    ownerName = normalizeName(extractOwnerName(text));
  }

  // additionalDetails: capture the descriptive paragraph that contains the
  // requester's name + position/affiliation/research title. Falls back to null
  // when no such paragraph exists (e.g., short form-style documents).
  const additionalDetails = extractAdditionalDetails(text, requesterName);

  return { requesterName, requestDate, source, ownerName, additionalDetails };
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

function normalizeWhitespace(value: string) {
  return value
    .replace(/[๐-๙]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 3616))
    .replace(/ำ/g, "า")
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

function normalizeName(value: string | null) {
  if (!value) return null;

  return value
    .replace(/\s+/g, " ")
    .replace(/^(ชื่อผู้ขอ|ชื่อผู้ยืม)\s*/i, "")
    // Add space between Thai title and first name if fused (e.g., "นางสาวธนิฏฐา" → "นางสาว ธนิฏฐา")
    .replace(/^(นาย|นางสาว|นาง(?!สาว)|น\.ส\.)(\S)/, "$1 $2")
    // Letter-format: strip trailing position/affiliation text
    .replace(/\s+(ต[ำา]แหน่ง|สังกัด|กรม|จังหวัด|ซึ่ง|เป็น|ใช้|ขออนุญาต|มีความประสงค์|ไปใช้).*$/i, "")
    .replace(/(รหัสนักศึกษา|สาขา|วันที่ขอ|เครื่องมือวิจัยที่ขอยืม|จุดประสงค์การยืม).*$/i, "")
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
    // Strip Thai recipient titles from the start (keep only place/organization name)
    // e.g., "ผู้อำนวยการโรงพยาบาล..." → "โรงพยาบาล..."
    // Use [ำา] because normalizeWhitespace converts ำ → า upstream.
    .replace(
      /^(?:รอง|ผู้ช่วย)?\s*(?:ผู้อ[ำา]นวยการ|คณบดี|อธิการบดี|หัวหน้า|ผู้บัญชาการ|ผู้จัดการ|เลขานุการ|ประธาน|นายแพทย์|แพทย์|ศาสตราจารย์|ผู้ตรวจราชการ|ผู้ตรวจการ|ผู้แทนพาณิชย์)/i,
      "",
    )
    .replace(/\s*(หมายเหตุ|ลงชื่อผู้ขอ|ผู้อนุมัติ)\s*:.*$/i, "")
    .replace(/\s*มีความประสงค์.*$/i, "")
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
    .replace(/[๐-๙]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 3616))
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
