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
