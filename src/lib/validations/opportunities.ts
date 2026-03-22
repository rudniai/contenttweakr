import { z } from 'zod';

export const hideOpportunitySchema = z.object({
  opportunityId: z
    .string({ error: 'opportunityId is required' })
    .uuid('opportunityId must be a valid UUID'),
  hidden: z
    .boolean({ error: 'hidden must be a boolean' }),
});

export type HideOpportunityInput = z.infer<typeof hideOpportunitySchema>;

export const markRepliedSchema = z.object({
  opportunityId: z
    .string({ error: 'opportunityId is required' })
    .uuid('opportunityId must be a valid UUID'),
});

export type MarkRepliedInput = z.infer<typeof markRepliedSchema>;

const uuidArray = z
  .array(z.string().uuid('Each ID must be a valid UUID'))
  .min(1, 'At least one ID is required')
  .max(100, 'Maximum 100 items per bulk action');

export const bulkHideSchema = z.object({
  opportunityIds: uuidArray,
  hidden: z.boolean({ error: 'hidden must be a boolean' }),
});

export type BulkHideInput = z.infer<typeof bulkHideSchema>;

export const bulkRepliedSchema = z.object({
  opportunityIds: uuidArray,
});

export type BulkRepliedInput = z.infer<typeof bulkRepliedSchema>;

export const bulkDeleteSchema = z.object({
  opportunityIds: uuidArray,
});

export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;
