// ── Reddit scanning configuration ────────────────────────────────────────────

export const SUBREDDITS = [
  'webdev', 'SEO', 'smallbusiness', 'Entrepreneur', 'SaaS',
  'web_design', 'bigseo', 'marketing', 'startups', 'digitalnomad',
  'indiehackers', 'indiedev', 'coderforhire', 'webdevtutorials', 'reactjs', 'nextjs',
];

export const KEYWORDS = [
  'website audit', 'seo check', 'site speed', 'ranking', 'free seo',
  'website health', 'pagespeed', 'lighthouse', 'gtmetrix', 'site performance',
  'core web vitals', 'mobile friendly', 'seo tools', 'website analyzer',
  'website', 'site', 'my website', 'my site',
  'feedback', 'review my', 'help with', 'advice',
  'optimize', 'improve', 'slow', 'broken',
];

export const QUESTION_PATTERNS = [
  /how (do|can) i check/i,
  /what tool(s)? (can|should) i use/i,
  /need recommendations? for/i,
  /is there a (free|good)/i,
  /anyone know a (good|free)/i,
  /looking for (a|an) (free|good|cheap)/i,
  /can someone (review|check|look at)/i,
  /feedback on my/i,
  /thoughts on/i,
  /how to (improve|optimize|fix)/i,
];

export function isRelevant(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  const hasKeyword = KEYWORDS.some((kw) => lowerText.includes(kw.toLowerCase()));
  const hasQuestionPattern = QUESTION_PATTERNS.some((pattern) => pattern.test(text));
  return hasKeyword || hasQuestionPattern;
}

export function calculateRelevance(title: string, selftext: string): number {
  let score = 0;
  const text = `${title} ${selftext || ''}`.toLowerCase();

  const highValueKeywords = ['website audit', 'seo check', 'free seo tool', 'site speed'];
  highValueKeywords.forEach((kw) => {
    if (text.includes(kw)) score += 25;
  });

  if (QUESTION_PATTERNS.some((p) => p.test(text))) score += 15;

  const broadKeywords = ['website', 'site', 'my website', 'my site'];
  KEYWORDS.forEach((kw) => {
    if (text.includes(kw.toLowerCase())) {
      if (broadKeywords.includes(kw)) {
        score += 10;
      } else if (!highValueKeywords.includes(kw)) {
        score += 5;
      }
    }
  });

  return Math.min(100, score);
}
