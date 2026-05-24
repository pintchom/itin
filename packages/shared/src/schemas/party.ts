import { z } from 'zod';

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const ianaTimezone = z
  .string()
  .min(1)
  .max(64)
  .refine((tz) => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, 'Invalid IANA timezone');

export const createPartySchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    startDate: isoDate,
    endDate: isoDate,
    coverImageKey: z.string().min(1).max(128).optional().nullable(),
    timezone: ianaTimezone.default('UTC'),
  })
  .refine((v) => v.startDate <= v.endDate, {
    message: 'startDate must be on or before endDate',
    path: ['endDate'],
  });

export const updatePartySchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    startDate: isoDate.optional(),
    endDate: isoDate.optional(),
    coverImageKey: z.string().min(1).max(128).nullable().optional(),
    timezone: ianaTimezone.optional(),
  })
  .refine((v) => v.startDate === undefined || v.endDate === undefined || v.startDate <= v.endDate, {
    message: 'startDate must be on or before endDate',
    path: ['endDate'],
  });

export type CreatePartyInput = z.infer<typeof createPartySchema>;
export type UpdatePartyInput = z.infer<typeof updatePartySchema>;
