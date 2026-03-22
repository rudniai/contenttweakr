import { z } from 'zod';

export const scanTriggerSchema = z.object({
  hours: z
    .number({ error: 'hours must be a number' })
    .int('hours must be a whole number')
    .min(1, 'hours must be at least 1')
    .max(168, 'hours must be at most 168 (1 week)')
    .optional()
    .default(24),
});

export type ScanTriggerInput = z.infer<typeof scanTriggerSchema>;
