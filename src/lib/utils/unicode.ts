import type { Locale } from "@/types/domain";

const SINHALA_START = 0x0d80;
const SINHALA_END = 0x0dff;

// Singlish: Sinhala intent typed in plain Latin letters ("mage ammata ekak
// ona", "kohomada", "monawada karanne"). Detected as "si" (not "ta-Latn") so
// the assistant replies in Sinhala Unicode script — there's no separate
// "Sinhala in Latin script" option in the language dropdown, only en/si/ta-Latn.
const SINGLISH_PATTERNS = [
  /\b(ekak|karanna|karanne|laga|karala|eka|denna|ganna|mama|api|koheda|kohomada|monada|monawada|ona|thiyenawa|puluwan|hondai|godak|kiyanna|balamu|ow|naehae|hari)\b/i,
];

// Tanglish: Tamil intent typed in plain Latin letters ("eppadi irukinga",
// "nalla iruku", "seri", "venum").
const TANGLISH_PATTERNS = [
  /\b(eppadi|irukinga|iruku|nalla|seri|venum|vennum|romba|epdi|panren|panunga)\b/i,
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

  if (SINGLISH_PATTERNS.some((p) => p.test(normalized))) {
    return "si";
  }

  if (TANGLISH_PATTERNS.some((p) => p.test(normalized))) {
    return "ta-Latn";
  }

  return "en";
}
