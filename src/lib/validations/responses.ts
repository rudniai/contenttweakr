import { z } from 'zod';

export const generateResponseSchema = z.object({
  title: z
    .string({ error: 'title is required' })
    .min(1, 'title must not be empty')
    .max(500, 'title must be at most 500 characters'),
  context: z
    .string()
    .max(5000, 'context must be at most 5000 characters')
    .optional()
    .default(''),
  subreddit: z
    .string({ error: 'subreddit is required' })
    .min(1, 'subreddit must not be empty')
    .max(100, 'subreddit must be at most 100 characters'),
  opportunityUrl: z
    .string()
    .url('opportunityUrl must be a valid URL')
    .optional(),
});

export type GenerateResponseInput = z.infer<typeof generateResponseSchema>;
