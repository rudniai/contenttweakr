/**
 * Claude-powered semantic analysis for opportunity scoring.
 * Uses Haiku for fast, cheap analysis of whether a post represents
 * a genuine opportunity + competitor detection in comments.
 *
 * Enabled via ENABLE_SEMANTIC_SCORING=true env var.
 */

import Anthropic from '@anthropic-ai/sdk';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SemanticResult {
  score: number; // 0-100
  reasoning: string;
  competitors_mentioned: string[];
  has_helpful_responses: boolean;
}

interface BatchItem {
  id: string;
  title: string;
  body: string;
  comments: string[];
}

// ── Config ───────────────────────────────────────────────────────────────────

const SEMANTIC_MODEL = 'claude-haiku-4-5-20251001';

const COMPETITORS = [
  'ahrefs', 'semrush', 'moz', 'screaming frog', 'screamingfrog',
  'ubersuggest', 'serpstat', 'se ranking', 'seranking',
  'sitebulb', 'deepcrawl', 'lumar', 'botify',
  'mangools', 'kwfinder', 'surfer seo', 'surferseo',
  'clearscope', 'marketmuse', 'frase',
  'woorank', 'seolyzer', 'seobility',
  'gtmetrix', 'pingdom', 'webpagetest',
];

const SYSTEM_PROMPT = `You are an opportunity scorer for a website audit SaaS tool (freesiteaudit.com). Analyze whether this Reddit/forum post represents a genuine opportunity for helpful engagement.

Score 0-100 based on:
- Is this person genuinely seeking help with their website, SEO, or site performance? (high score)
- Are they asking for tool recommendations or feedback? (high score)
- Is this a generic discussion with no actionable need? (low score)
- Is this a self-promotional post or someone selling services? (low score)
- Has someone already provided comprehensive help? (lower score)

Also identify:
- Any SEO/web tools or competitors already mentioned in comments
- Whether there are already helpful, detailed responses

Respond ONLY with valid JSON (no markdown fencing):
{"score": <number 0-100>, "reasoning": "<one sentence>", "competitors_mentioned": ["<tool names>"], "has_helpful_responses": <boolean>}`;

// ── Cache ────────────────────────────────────────────────────────────────────

const cache = new Map<string, SemanticResult>();

function getCacheKey(title: string, body: string): string {
  return `${title.slice(0, 100)}::${body.slice(0, 200)}`;
}

// ── Competitor detection (fast, no API) ──────────────────────────────────────

export function detectCompetitors(texts: string[]): string[] {
  const combined = texts.join(' ').toLowerCase();
  return COMPETITORS.filter((c) => combined.includes(c));
}

// ── Semantic scoring ─────────────────────────────────────────────────────────

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic();
  }
  return anthropicClient;
}

export async function analyzeOpportunity(
  title: string,
  body: string,
  topComments: string[] = [],
): Promise<SemanticResult> {
  const cacheKey = getCacheKey(title, body);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const client = getClient();

  const userContent = [
    `**Post title:** ${title}`,
    `**Post body:** ${body.slice(0, 1000) || '(empty)'}`,
    topComments.length > 0
      ? `**Top comments:**\n${topComments.slice(0, 3).map((c, i) => `${i + 1}. ${c.slice(0, 300)}`).join('\n')}`
      : '**Top comments:** (none)',
  ].join('\n\n');

  try {
    const message = await client.messages.create({
      model: SEMANTIC_MODEL,
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    const block = message.content[0];
    if (block.type !== 'text') {
      throw new Error('Unexpected response format');
    }

    const parsed = JSON.parse(block.text) as SemanticResult;
    const result: SemanticResult = {
      score: Math.max(0, Math.min(100, parsed.score)),
      reasoning: parsed.reasoning || '',
      competitors_mentioned: parsed.competitors_mentioned || [],
      has_helpful_responses: parsed.has_helpful_responses ?? false,
    };

    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error('[semantic-scorer] Analysis failed:', err instanceof Error ? err.message : err);
    // Fallback: return neutral score so keyword scoring still works
    return {
      score: 50,
      reasoning: 'Semantic analysis failed, using fallback score',
      competitors_mentioned: detectCompetitors([title, body, ...topComments]),
      has_helpful_responses: false,
    };
  }
}

// ── Batch analysis ───────────────────────────────────────────────────────────

export async function batchAnalyze(
  items: BatchItem[],
): Promise<Map<string, SemanticResult>> {
  const results = new Map<string, SemanticResult>();
  const BATCH_SIZE = 5;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (item) => {
      const result = await analyzeOpportunity(item.title, item.body, item.comments);
      results.set(item.id, result);
    });
    await Promise.all(promises);

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < items.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

// ── Combined scoring ─────────────────────────────────────────────────────────

export function combineScores(keywordScore: number, semanticResult: SemanticResult): number {
  let semanticScore = semanticResult.score;

  // Reduce score if competitors already recommended
  const competitorCount = semanticResult.competitors_mentioned.length;
  if (competitorCount >= 2) {
    // Multiple competitors = skip (return 0)
    return 0;
  }
  if (competitorCount === 1) {
    semanticScore = Math.round(semanticScore * 0.5);
  }

  // Reduce if already has helpful responses
  if (semanticResult.has_helpful_responses) {
    semanticScore = Math.round(semanticScore * 0.7);
  }

  // Weighted combination: keyword 40%, semantic 60%
  const combined = Math.round(keywordScore * 0.4 + semanticScore * 0.6);
  return Math.min(100, Math.max(0, combined));
}

// ── Feature flag ─────────────────────────────────────────────────────────────

export function isSemanticScoringEnabled(): boolean {
  return process.env.ENABLE_SEMANTIC_SCORING === 'true';
}
