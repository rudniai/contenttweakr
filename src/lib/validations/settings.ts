import { z } from 'zod';

const tagArray = z
  .array(z.string().min(1).max(100))
  .max(50, 'Maximum 50 items');

export const updateSettingsSchema = z.object({
  subreddits: tagArray.nullable(),
  keywords: tagArray.nullable(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
