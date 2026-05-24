import { z } from 'zod';

export const rsvpSchema = z.object({
  status: z.enum(['GOING', 'NOT_GOING']),
});

export type RsvpInput = z.infer<typeof rsvpSchema>;
