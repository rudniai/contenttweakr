import { describe, it, expect } from 'vitest';
import {
  isRelevant,
  calculateRelevance,
  SUBREDDITS,
  KEYWORDS,
  QUESTION_PATTERNS,
} from '../reddit/config';

describe('isRelevant', () => {
  it('returns false for empty string', () => {
    expect(isRelevant('')).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isRelevant(null as unknown as string)).toBe(false);
    expect(isRelevant(undefined as unknown as string)).toBe(false);
  });

  it('returns true when text contains a keyword', () => {
    expect(isRelevant('How do I run a website audit?')).toBe(true);
    expect(isRelevant('My pagespeed score is low')).toBe(true);
    expect(isRelevant('Need help with core web vitals')).toBe(true);
  });

  it('returns true for case-insensitive keyword match', () => {
    expect(isRelevant('WEBSITE AUDIT needed')).toBe(true);
    expect(isRelevant('PageSpeed is important')).toBe(true);
  });

  it('returns true when text matches a question pattern', () => {
    expect(isRelevant('How do I check my site?')).toBe(true);
    expect(isRelevant('Can someone review my homepage?')).toBe(true);
    expect(isRelevant('Is there a free tool for this?')).toBe(true);
    expect(isRelevant('How to improve loading speed')).toBe(true);
  });

  it('returns false for irrelevant text', () => {
    expect(isRelevant('The weather is nice today')).toBe(false);
    expect(isRelevant('I love cooking pasta')).toBe(false);
  });

  it('returns true for broad keywords', () => {
    expect(isRelevant('My website is down')).toBe(true);
    expect(isRelevant('Check out this site')).toBe(true);
  });
});

describe('calculateRelevance', () => {
  it('returns 0 for irrelevant content', () => {
    expect(calculateRelevance('Cooking tips', 'How to make pasta')).toBe(0);
  });

  it('scores high-value keywords at +25', () => {
    const score = calculateRelevance('Need a website audit', '');
    // 'website audit' = +25 (high-value) + 5 (regular keyword match for 'website audit')
    // + 10 (broad 'website') + other matches
    expect(score).toBeGreaterThanOrEqual(25);
  });

  it('scores question patterns at +15', () => {
    const score = calculateRelevance('How do I check my server logs?', '');
    // 'how do i check' matches question pattern = +15
    expect(score).toBeGreaterThanOrEqual(15);
  });

  it('scores broad keywords at +10', () => {
    const scoreWebsite = calculateRelevance('Check out my website', '');
    // 'website' broad = +10, 'my website' broad = +10
    expect(scoreWebsite).toBeGreaterThanOrEqual(10);
  });

  it('accumulates scores from multiple matches', () => {
    const score = calculateRelevance(
      'Need a free seo website audit tool',
      'How can I check my site speed and core web vitals?'
    );
    // Multiple high-value + question + regular keywords
    expect(score).toBeGreaterThanOrEqual(50);
  });

  it('caps score at 100', () => {
    const score = calculateRelevance(
      'website audit seo check free seo tool site speed',
      'pagespeed lighthouse gtmetrix core web vitals mobile friendly website analyzer how do i check my site optimize improve slow broken'
    );
    expect(score).toBeLessThanOrEqual(100);
  });

  it('considers selftext in scoring', () => {
    const titleOnly = calculateRelevance('Help needed', '');
    const withSelftext = calculateRelevance('Help needed', 'My website audit shows bad pagespeed scores');
    expect(withSelftext).toBeGreaterThan(titleOnly);
  });

  it('handles empty selftext gracefully', () => {
    const score = calculateRelevance('website audit help', '');
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe('config constants', () => {
  it('has subreddits defined', () => {
    expect(SUBREDDITS.length).toBeGreaterThan(0);
    expect(SUBREDDITS).toContain('webdev');
    expect(SUBREDDITS).toContain('SEO');
  });

  it('has keywords defined', () => {
    expect(KEYWORDS.length).toBeGreaterThan(0);
    expect(KEYWORDS).toContain('website audit');
    expect(KEYWORDS).toContain('seo check');
  });

  it('has question patterns defined', () => {
    expect(QUESTION_PATTERNS.length).toBeGreaterThan(0);
    QUESTION_PATTERNS.forEach((p) => {
      expect(p).toBeInstanceOf(RegExp);
    });
  });
});
