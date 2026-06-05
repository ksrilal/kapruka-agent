import type { Locale } from "@/types/domain";

const SINHALA_START = 0x0d80;
const SINHALA_END = 0x0dff;

const TANGLISH_PATTERNS = [
  /\b(ekak|karanna|laga|give|karala|eka|denna|ganna|mama|api|koheda|monada)\b/i,
];

export function normalizeSinhala(text: string): string {
  return text.normalize("NFC");
}

export function detectLocale(text: string): Locale {
  const normalized = normalizeSinhala(text);

  for (const char of normalized) {
    const cp = char.codePointAt(0) ?? 0;
    if (cp >= SINHALA_START && cp <= SINHALA_END) {
      return "si";
    }
  }

  if (TANGLISH_PATTERNS.some((p) => p.test(normalized))) {
    return "ta-Latn";
  }

  return "en";
}
