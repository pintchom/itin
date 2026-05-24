import { z } from 'zod';

export const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected #RRGGBB');

export const createActivitySchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    location: z.string().trim().max(200).optional().nullable(),
    color: hexColor.optional().nullable(),
    // User ids to pre-assign as GOING. Creator is always implicitly included.
    participantUserIds: z.array(z.string().min(1)).max(500).default([]),
  })
  .refine((v) => v.startsAt < v.endsAt, {
    message: 'endsAt must be after startsAt',
    path: ['endsAt'],
  });

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
