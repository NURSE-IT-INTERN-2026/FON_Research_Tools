import PDFDocument from "pdfkit";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONT_REGULAR = join(__dirname, "../src/fonts/Sarabun-Regular.ttf");
const FONT_BOLD = join(__dirname, "../src/fonts/Sarabun-Bold.ttf");

const doc = new PDFDocument({ size: "A4", margin: 60 });
doc.registerFont("Sarabun", FONT_REGULAR);
doc.registerFont("SarabunBold", FONT_BOLD);

const chunks: Buffer[] = [];
doc.on("data", (chunk: Buffer) => chunks.push(chunk));

doc.on("end", () => {
  const outPath = join(__dirname, "../uploads/test-license.pdf");
  writeFileSync(outPath, Buffer.concat(chunks));
  console.log(`Created: ${outPath}`);
});

// Header
doc.font("SarabunBold").fontSize(16).text("ใบอนุญาตขอยืมเครื่องมือวิจัย", { align: "center" });
doc.moveDown(0.3);
doc.font("Sarabun").fontSize(12).text("คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่", { align: "center" });
doc.moveDown(1.5);

// Form fields
const fields = [
  ["ชื่อผู้ขอ", "นางสาวสมหญิง ใจดี"],
  ["รหัสนักศึกษา", "650123456"],
  ["สาขา", "พยาบาลศาสตร์"],
  ["วันที่ขอ", "15 พฤษภาคม 2569"],
  ["เครื่องมือวิจัยที่ขอยืม", "The Positive Discipline Questionnaire"],
  ["จุดประสงค์การยืม", "ใช้เป็นเครื่องมือเก็บข้อมูลในการวิจัยเพื่อวิทยานิพนธ์ เรื่อง ปัจจัยที่สัมพันธ์กับการใช้วินัยเชิงบวกของบิดามารดา"],
];

for (const [label, value] of fields) {
  doc.font("SarabunBold").fontSize(12).text(`${label}: `, { continued: true });
  doc.font("Sarabun").text(value);
  doc.moveDown(0.5);
}

doc.moveDown(1);
doc.font("Sarabun").fontSize(10).text("หมายเหตุ: เอกสารนี้จัดทำขึ้นเพื่อการทดสอบระบบ", { align: "center" });

doc.end();
