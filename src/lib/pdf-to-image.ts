import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

export function convertPdfToImage(pdfBuffer: Buffer): Buffer {
  const id = randomUUID();
  const pdfPath = join(tmpdir(), `${id}.pdf`);
  const pngPath = join(tmpdir(), `${id}.png`);

  try {
    writeFileSync(pdfPath, pdfBuffer);

    if (process.platform === "darwin") {
      execFileSync("sips", ["-s", "format", "png", pdfPath, "--out", pngPath], {
        timeout: 15000,
      });
    } else {
      execFileSync("pdftoppm", ["-png", "-f", "1", "-l", "1", "-r", "200", pdfPath, pngPath.replace(".png", "")], {
        timeout: 15000,
      });
    }

    return readFileSync(pngPath);
  } finally {
    try { unlinkSync(pdfPath); } catch {}
    try { unlinkSync(pngPath); } catch {}
  }
}
