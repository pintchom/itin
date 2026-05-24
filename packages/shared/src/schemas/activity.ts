import { z } from 'zod';

export const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected #RRGGBB');

export const createActivitySchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).optional().nullable(),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    location: z.string().trim().max(200).optional().nullable(),
    color: hexColor.optional().nullable(),
    coverImageKey: z.string().min(1).max(128).optional().nullable(),
    // User ids to pre-assign as GOING. Creator is always implicitly included.
    participantUserIds: z.array(z.string().min(1)).max(500).default([]),
  })
  .refine((v) => v.startsAt < v.endsAt, {
    message: 'endsAt must be after startsAt',
    path: ['endsAt'],
  });

export type CreateActivityInput = z.infer<typeof createActivitySchema>;

export const updateActivitySchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    startsAt: z.string().datetime({ offset: true }).optional(),
    endsAt: z.string().datetime({ offset: true }).optional(),
    location: z.string().trim().max(200).nullable().optional(),
    color: hexColor.nullable().optional(),
    coverImageKey: z.string().min(1).max(128).nullable().optional(),
  })
  .refine((v) => v.startsAt === undefined || v.endsAt === undefined || v.startsAt < v.endsAt, {
    message: 'endsAt must be after startsAt',
    path: ['endsAt'],
  });

export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
