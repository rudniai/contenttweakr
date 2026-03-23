import { z } from 'zod';

const tagArray = z
  .array(z.string().min(1).max(100))
  .max(50, 'Maximum 50 items');

export const SCAN_FREQUENCIES = ['disabled', 'daily', 'twice_daily', 'every_6h'] as const;
export type ScanFrequency = typeof SCAN_FREQUENCIES[number];

export const SCAN_FREQUENCY_LABELS: Record<ScanFrequency, string> = {
  disabled: 'Disabled',
  daily: 'Daily',
  twice_daily: 'Twice daily',
  every_6h: 'Every 6 hours',
};

export const updateSettingsSchema = z.object({
  subreddits: tagArray.nullable(),
  keywords: tagArray.nullable(),
  scan_frequency: z.enum(SCAN_FREQUENCIES).optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
