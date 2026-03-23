// ── Product Hunt scoring ─────────────────────────────────────────────────────
// Reuses the same pattern as Reddit/HN scoring but with PH-specific adjustments.

import { KEYWORDS, QUESTION_PATTERNS } from '../reddit/config';

// PH-specific high-value keywords (product launches, tools, feedback)
const PH_HIGH_VALUE_KEYWORDS = [
  'website audit', 'seo tool', 'site speed', 'core web vitals',
  'lighthouse', 'pagespeed', 'web performance', 'website analyzer',
  'site checker', 'seo checker', 'website grader', 'performance tool',
  'web audit', 'website monitor', 'uptime monitor',
];

// PH posts about launching tools are high-value
const PH_LAUNCH_PATTERNS = [
  /launch(ed|ing)?/i,
  /just (built|shipped|released|launched)/i,
  /check out my/i,
  /we('re| are) building/i,
  /open source/i,
  /free tool/i,
];

export function isPHRelevant(name: string, tagline: string, description: string): boolean {
  const combined = `${name} ${tagline} ${description || ''}`.toLowerCase();
  const hasKeyword = KEYWORDS.some((kw) => combined.includes(kw.toLowerCase()));
  const hasQuestionPattern = QUESTION_PATTERNS.some((p) => p.test(combined));
  const hasPHKeyword = PH_HIGH_VALUE_KEYWORDS.some((kw) => combined.includes(kw));
  return hasKeyword || hasQuestionPattern || hasPHKeyword;
}

export function calculatePHRelevance(name: string, tagline: string, description: string): number {
  let score = 0;
  const combined = `${name} ${tagline} ${description || ''}`.toLowerCase();

  // PH launch patterns get a boost
  if (PH_LAUNCH_PATTERNS.some((p) => p.test(combined))) score += 15;

  // High-value PH keywords
  for (const kw of PH_HIGH_VALUE_KEYWORDS) {
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
      } else if (!PH_HIGH_VALUE_KEYWORDS.includes(kw)) {
        score += 5;
      }
    }
  }

  return Math.min(100, score);
}
