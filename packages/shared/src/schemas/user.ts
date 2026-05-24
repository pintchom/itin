import { z } from 'zod';

export const nameSchema = z.string().trim().min(1).max(60);

export const completeProfileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

export const updateProfileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  profileImageKey: z.string().min(1).nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const emailPasswordSignUpSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  firstName: nameSchema,
  lastName: nameSchema,
});

export const emailPasswordSignInSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
});

export const phoneSendOtpSchema = z.object({
  phoneNumber: z.string().trim().min(8).max(20),
});

export const phoneSignUpSchema = z.object({
  phoneNumber: z.string().trim().min(8).max(20),
  code: z.string().trim().min(4).max(10),
  password: z.string().min(8).max(128),
  firstName: nameSchema,
  lastName: nameSchema,
});

export const phoneSignInSchema = z.object({
  phoneNumber: z.string().trim().min(8).max(20),
  password: z.string().min(1).max(128),
});

export type EmailPasswordSignUpInput = z.infer<typeof emailPasswordSignUpSchema>;
export type EmailPasswordSignInInput = z.infer<typeof emailPasswordSignInSchema>;
export type PhoneSendOtpInput = z.infer<typeof phoneSendOtpSchema>;
export type PhoneSignUpInput = z.infer<typeof phoneSignUpSchema>;
export type PhoneSignInInput = z.infer<typeof phoneSignInSchema>;
