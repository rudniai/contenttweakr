// Keyword-based sentiment analysis for filtering toxic threads
// Lightweight MVP approach - can be upgraded to Claude-based analysis later

const TOXIC_KEYWORDS = [
  'scam', 'scammer', 'fraud', 'ripoff', 'rip-off', 'rip off',
  'hate', 'hating', 'hatred',
  'terrible', 'horrible', 'awful', 'disgusting',
  'worst', 'useless', 'garbage', 'trash', 'junk',
  'angry', 'furious', 'outraged', 'pissed',
  'stupid', 'idiot', 'moron', 'dumb',
  'lawsuit', 'sue', 'suing', 'lawyer',
  'spam', 'spammer', 'spamming',
  'fake', 'phishing', 'malware', 'virus',
  'f**k', 'fck', 'stfu', 'gtfo',
  'die', 'kill', 'death threat',
  'racist', 'sexist', 'bigot',
  'pyramid scheme', 'ponzi', 'mlm',
  'never buy', 'stay away', 'avoid at all cost',
  'waste of money', 'waste of time', 'complete waste',
  'total crap', 'total garbage', 'total junk',
];

const HOSTILE_PATTERNS = [
  /don'?t (?:ever |even )?(?:trust|buy|use|try)/i,
  /(?:company|they|these people) (?:are |is )?(?:scam|fraud|fake|lying)/i,
  /(?:i'?m|we'?re|everyone is) (?:so |really )?(?:angry|furious|pissed|fed up)/i,
  /(?:worst|terrible|horrible) (?:experience|company|service|product)/i,
  /(?:file|filing) (?:a )?(?:complaint|lawsuit|chargeback)/i,
];

const TOXIC_THRESHOLD = -20;

/**
 * Calculate a sentiment score for text content.
 * Returns a number where negative = toxic, 0 = neutral, positive = positive.
 * Each toxic keyword match subtracts points.
 */
export function calculateSentiment(title: string, body: string): number {
  const text = `${title} ${body}`.toLowerCase();
  let score = 0;

  // Check toxic keywords (-5 each)
  for (const keyword of TOXIC_KEYWORDS) {
    if (text.includes(keyword)) {
      score -= 5;
    }
  }

  // Check hostile patterns (-10 each)
  for (const pattern of HOSTILE_PATTERNS) {
    if (pattern.test(text)) {
      score -= 10;
    }
  }

  return score;
}

/**
 * Check if content is too toxic to be a good opportunity.
 * Returns true if the content should be skipped.
 */
export function isToxic(title: string, body: string): boolean {
  return calculateSentiment(title, body) < TOXIC_THRESHOLD;
}

export { TOXIC_THRESHOLD };
