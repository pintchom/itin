import { z } from 'zod';

export const inviteTokenSchema = z
  .string()
  .min(16)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/);

export const createInviteSchema = z.object({
  expiresInDays: z.number().int().positive().max(365).optional(),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
