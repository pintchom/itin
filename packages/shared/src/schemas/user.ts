import { z } from 'zod';

export const nameSchema = z.string().trim().min(1).max(60);

export const completeProfileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
