import { describe, it, expect } from 'vitest';
import { scanTriggerSchema } from '../validations/scan';
import { generateResponseSchema } from '../validations/responses';
import { updateSettingsSchema } from '../validations/settings';
import {
  hideOpportunitySchema,
  markRepliedSchema,
  bulkHideSchema,
  bulkRepliedSchema,
  bulkDeleteSchema,
} from '../validations/opportunities';

describe('scanTriggerSchema', () => {
  it('accepts valid hours', () => {
    expect(scanTriggerSchema.safeParse({ hours: 24 }).success).toBe(true);
    expect(scanTriggerSchema.safeParse({ hours: 1 }).success).toBe(true);
    expect(scanTriggerSchema.safeParse({ hours: 168 }).success).toBe(true);
  });

  it('defaults hours to 24', () => {
    const result = scanTriggerSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hours).toBe(24);
    }
  });

  it('rejects invalid hours', () => {
    expect(scanTriggerSchema.safeParse({ hours: 0 }).success).toBe(false);
    expect(scanTriggerSchema.safeParse({ hours: 169 }).success).toBe(false);
    expect(scanTriggerSchema.safeParse({ hours: -1 }).success).toBe(false);
    expect(scanTriggerSchema.safeParse({ hours: 1.5 }).success).toBe(false);
  });

  it('rejects non-number hours', () => {
    expect(scanTriggerSchema.safeParse({ hours: 'abc' }).success).toBe(false);
  });
});

describe('generateResponseSchema', () => {
  it('accepts valid input', () => {
    const result = generateResponseSchema.safeParse({
      title: 'Test post',
      subreddit: 'webdev',
    });
    expect(result.success).toBe(true);
  });

  it('accepts full input with optional fields', () => {
    const result = generateResponseSchema.safeParse({
      title: 'Test post',
      context: 'Some context',
      subreddit: 'webdev',
      opportunityUrl: 'https://reddit.com/r/webdev/comments/abc123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    expect(
      generateResponseSchema.safeParse({ subreddit: 'webdev' }).success
    ).toBe(false);
  });

  it('rejects missing subreddit', () => {
    expect(
      generateResponseSchema.safeParse({ title: 'Test' }).success
    ).toBe(false);
  });

  it('rejects empty title', () => {
    expect(
      generateResponseSchema.safeParse({ title: '', subreddit: 'webdev' }).success
    ).toBe(false);
  });

  it('rejects title exceeding 500 chars', () => {
    expect(
      generateResponseSchema.safeParse({
        title: 'a'.repeat(501),
        subreddit: 'webdev',
      }).success
    ).toBe(false);
  });

  it('rejects invalid opportunityUrl', () => {
    expect(
      generateResponseSchema.safeParse({
        title: 'Test',
        subreddit: 'webdev',
        opportunityUrl: 'not-a-url',
      }).success
    ).toBe(false);
  });
});

describe('updateSettingsSchema', () => {
  it('accepts valid subreddits and keywords', () => {
    const result = updateSettingsSchema.safeParse({
      subreddits: ['webdev', 'SEO'],
      keywords: ['website audit'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts null to reset to defaults', () => {
    const result = updateSettingsSchema.safeParse({
      subreddits: null,
      keywords: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects arrays exceeding 50 items', () => {
    const tooMany = Array.from({ length: 51 }, (_, i) => `item-${i}`);
    expect(
      updateSettingsSchema.safeParse({ subreddits: tooMany, keywords: [] }).success
    ).toBe(false);
  });

  it('rejects empty string items', () => {
    expect(
      updateSettingsSchema.safeParse({ subreddits: [''], keywords: [] }).success
    ).toBe(false);
  });
});

describe('hideOpportunitySchema', () => {
  it('accepts valid UUID and boolean', () => {
    const result = hideOpportunitySchema.safeParse({
      opportunityId: '550e8400-e29b-41d4-a716-446655440000',
      hidden: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID string', () => {
    expect(
      hideOpportunitySchema.safeParse({ opportunityId: 'not-uuid', hidden: true }).success
    ).toBe(false);
  });

  it('rejects missing hidden field', () => {
    expect(
      hideOpportunitySchema.safeParse({
        opportunityId: '550e8400-e29b-41d4-a716-446655440000',
      }).success
    ).toBe(false);
  });
});

describe('markRepliedSchema', () => {
  it('accepts valid UUID', () => {
    const result = markRepliedSchema.safeParse({
      opportunityId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    expect(markRepliedSchema.safeParse({ opportunityId: 'abc' }).success).toBe(false);
  });
});

describe('bulkHideSchema', () => {
  it('accepts valid UUIDs and hidden flag', () => {
    const result = bulkHideSchema.safeParse({
      opportunityIds: ['550e8400-e29b-41d4-a716-446655440000'],
      hidden: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty array', () => {
    expect(bulkHideSchema.safeParse({ opportunityIds: [], hidden: true }).success).toBe(false);
  });

  it('rejects more than 100 IDs', () => {
    const ids = Array.from({ length: 101 }, () => '550e8400-e29b-41d4-a716-446655440000');
    expect(bulkHideSchema.safeParse({ opportunityIds: ids, hidden: true }).success).toBe(false);
  });
});

describe('bulkRepliedSchema', () => {
  it('accepts valid UUIDs', () => {
    const result = bulkRepliedSchema.safeParse({
      opportunityIds: ['550e8400-e29b-41d4-a716-446655440000'],
    });
    expect(result.success).toBe(true);
  });
});

describe('bulkDeleteSchema', () => {
  it('accepts valid UUIDs', () => {
    const result = bulkDeleteSchema.safeParse({
      opportunityIds: ['550e8400-e29b-41d4-a716-446655440000'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID strings', () => {
    expect(
      bulkDeleteSchema.safeParse({ opportunityIds: ['not-a-uuid'] }).success
    ).toBe(false);
  });
});
