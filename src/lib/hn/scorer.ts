// ── Hacker News scoring ─────────────────────────────────────────────────────
// Reuses the same pattern as Reddit scoring but with HN-specific adjustments.

import { KEYWORDS, QUESTION_PATTERNS } from '../reddit/config';

// HN-specific high-value patterns
const HN_PATTERNS = [
  /^Ask HN:/i,
  /^Show HN:/i,
  /^Tell HN:/i,
  /^Launch HN:/i,
];

// HN audience tends to be more technical, so boost these
const HN_HIGH_VALUE_KEYWORDS = [
  'website audit', 'seo check', 'site speed', 'core web vitals',
  'lighthouse', 'pagespeed', 'performance', 'web performance',
  'site review', 'feedback on my site',
];

export function isHNRelevant(title: string, text: string): boolean {
  const combined = `${title} ${text || ''}`.toLowerCase();
  const hasKeyword = KEYWORDS.some((kw) => combined.includes(kw.toLowerCase()));
  const hasQuestionPattern = QUESTION_PATTERNS.some((p) => p.test(combined));
  const hasHNPattern = HN_PATTERNS.some((p) => p.test(title));
  return hasKeyword || hasQuestionPattern || hasHNPattern;
}

export function calculateHNRelevance(title: string, text: string): number {
  let score = 0;
  const combined = `${title} ${text || ''}`.toLowerCase();

  // HN-specific patterns get a boost (Ask HN, Show HN are high-intent)
  if (HN_PATTERNS.some((p) => p.test(title))) score += 20;

  // High-value keywords
  for (const kw of HN_HIGH_VALUE_KEYWORDS) {
    if (combined.includes(kw)) score += 25;
  }

  // Question patterns
  if (QUESTION_PATTERNS.some((p) => p.test(combined))) score += 15;

  // Broad keywords from shared config
  const broadKeywords = ['website', 'site', 'my website', 'my site'];
  for (const kw of KEYWORDS) {
    if (combined.includes(kw.toLowerCase())) {
      if (broadKeywords.includes(kw)) {
        score += 10;
      } else if (!HN_HIGH_VALUE_KEYWORDS.includes(kw)) {
        score += 5;
      }
    }
  }

  return Math.min(100, score);
}
