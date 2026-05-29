---
name: typhoon-ocr
description: 'Implement, modify, or debug OCR functionality using Typhoon OCR API for Thai document extraction. Use when working on PDF text extraction, image-based OCR via Typhoon Vision API, Thai date/name parsing, PDF-to-image conversion, or OCR server actions.'
argument-hint: 'What part of the OCR flow needs work?'
user-invocable: true
---

# Typhoon OCR Integration

Use this skill when an agent needs to add, change, debug, or review OCR functionality for Thai document extraction in this project.

## What This Skill Covers

- PDF text extraction using `pdftotext` CLI
- PDF-to-image conversion using `sips` (macOS) or `pdftoppm` (Linux)
- Typhoon Vision API (`/v1/chat/completions`) for image-based OCR
- Thai text parsing: names, dates (Buddhist/Gregorian), and block fields
- Server Action `processOCR` with role guard and file validation
- Fallback chain: text extraction → Typhoon Vision API → merge results

## When to Use

Use this skill when the task mentions any of these terms or behaviors:

- Typhoon OCR
- OCR, document reading, automatic extraction
- `extractLicenseData`, `processOCR`, `OCRResult`
- `TYPHOON_BASE_URL`, `TYPHOON_API_KEY`, `TYPHOON_OCR_MODEL`
- PDF to image conversion
- Thai date parsing, Buddhist year conversion
- `pdftotext`, `pdftoppm`, `sips`

## Architecture

```
User uploads PDF
      │
      ▼
processOCR (Server Action)
  ├── requireRole("STUDENT")
  ├── validate file (PDF, ≤10 MB)
  └── extractLicenseData(pdfBuffer)
        │
        ├─ 1. extractPdfText() ── pdftotext CLI
        │     └── parseTextFields()
        │           ├── findInlineField() → requesterName
        │           ├── findInlineField() → requestDate
        │           └── findBlockField()  → additionalDetails
        │
        ├─ 2. If result is complete → return early
        │
        └─ 3. If incomplete → Typhoon Vision API
              ├── convertPdfToImage() → PNG (sips/pdftoppm)
              ├── POST /v1/chat/completions with image + prompt
              ├── parseOCRResponse() → JSON extraction
              └── mergeOCRResults(textResult, ocrResult)
```

## Key Files

| File | Purpose |
|---|---|
| `src/lib/ocr.ts` | Core OCR logic: text extraction, Typhoon API call, Thai parsing |
| `src/lib/pdf-to-image.ts` | PDF → PNG conversion (platform-specific) |
| `src/actions/ocr-actions.ts` | Server Action wrapper with role guard and file validation |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TYPHOON_BASE_URL` | No | Typhoon API base URL (e.g. `https://api.opentyphoon.ai`) |
| `TYPHOON_API_KEY` | No | API key for Typhoon |
| `TYPHOON_OCR_MODEL` | No | Model name, defaults to `typhoon-ocr` |

If `TYPHOON_BASE_URL` or `TYPHOON_API_KEY` is missing, OCR falls back to text-only extraction via `pdftotext`.

## System Dependencies

- `pdftotext` (poppler-utils) — required for PDF text extraction
- `sips` (macOS built-in) or `pdftoppm` (poppler-utils) — required for PDF-to-image conversion when Typhoon API is configured

## OCR Result Type

```ts
type OCRResult = {
  requesterName: string | null;    // Thai name, e.g. "นางสาวสมหญิง ใจดี"
  requestDate: string | null;      // YYYY-MM-DD (Gregorian), e.g. "2026-05-15"
  additionalDetails: string | null; // Purpose/reason text
};
```

## Procedure

1. **Identify the task scope.**
   Match the task to one of these areas:
   - PDF text extraction or parsing logic
   - Typhoon API integration (request format, response parsing)
   - Thai date/name normalization
   - Server Action file validation or error handling
   - PDF-to-image conversion
   - Adding new extractable fields

2. **Read the relevant files before editing.**
   - For text extraction/parsing: `src/lib/ocr.ts` — `extractPdfText()`, `parseTextFields()`, `normalizeName()`, `normalizeDate()`, `normalizeDetails()`
   - For Typhoon API: `src/lib/ocr.ts` — `extractLicenseData()` (the fetch section), `parseOCRResponse()`, `OCR_PROMPT`
   - For PDF-to-image: `src/lib/pdf-to-image.ts`
   - For server action: `src/actions/ocr-actions.ts`

3. **Preserve the fallback chain.**
   The two-tier extraction is intentional:
   - Tier 1 (text extraction) is fast, free, and works for well-structured PDFs
   - Tier 2 (Typhoon Vision API) handles scanned documents or complex layouts
   - Results are merged: text extraction fills gaps where Typhoon misses, and vice versa
   - If Typhoon env vars are missing, the system degrades gracefully to text-only

4. **Keep Thai text handling correct.**
   - Thai digits (๐-๙) are converted to Arabic digits before parsing
   - Buddhist years (>2400) are converted to Gregorian by subtracting 543
   - Thai month names (full and abbreviated) are mapped in `THAI_MONTHS`
   - Date output is always `YYYY-MM-DD` in Gregorian calendar

5. **Validate changes.**
   - Run `npx tsc --noEmit` for type checking
   - Run `npm run lint` for code quality
   - Test with `MOCK_THESIS=true` and a sample PDF if available

## Decision Rules

- If the task is about extracting new fields, add them to `OCRResult`, update `OCR_PROMPT`, and add parsing in both `parseTextFields()` and `parseOCRResponse()`.
- If the task is about improving extraction accuracy, tune the prompt in `OCR_PROMPT` or the regex patterns in `findInlineField()`/`findBlockField()`.
- If the task is about supporting new Typhoon models, update `TYPHOON_OCR_MODEL` env var or the default in `extractLicenseData()`.
- If the task is about error handling, check `src/actions/ocr-actions.ts` for user-facing errors and `src/lib/ocr.ts` for internal error handling.
- If the task is about file size or format limits, update `MAX_FILE_SIZE` in `src/actions/ocr-actions.ts`.

## Quality Checks

The work is complete only when these are still true:

- text extraction via `pdftotext` works for structured PDFs without Typhoon API
- Typhoon Vision API is called only when text extraction is incomplete AND env vars are set
- Thai Buddhist dates are correctly converted to `YYYY-MM-DD` Gregorian
- Thai digits are normalized to Arabic digits before parsing
- temporary PDF and PNG files are cleaned up in `finally` blocks
- file validation rejects non-PDF and oversized files
- `requireRole("STUDENT")` guards the server action
- no API keys or secrets are logged
- TypeScript and ESLint pass

## Output Expectations

When using this skill, the agent should finish with:

- the minimal code change for the requested OCR behavior
- any necessary environment variable updates in `.env.example`
- a short note describing which part of the OCR pipeline changed and how it was validated
