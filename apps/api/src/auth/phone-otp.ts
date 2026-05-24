import { env } from '../env.ts';

/** E.164-ish: leading +, 7–15 digits total. */
export const isValidE164Phone = (phone: string) => /^\+[1-9]\d{6,14}$/.test(phone);

export const normalizePhoneNumber = (raw: string) => {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits.startsWith('+') ? digits : `+${digits}`;
};

export const sendPhoneOtp = async (phoneNumber: string, code: string) => {
  const line = `[itin] Phone OTP for ${phoneNumber}: ${code}`;
  console.log(line);

  if (env.NODE_ENV === 'production') {
    // Wire Twilio / SNS when credentials exist; until then log only.
    console.warn('[itin] Production phone OTP: configure an SMS provider in sendPhoneOtp');
  }
};

export const phoneTempEmail = (phoneNumber: string) =>
  `${phoneNumber.replace(/\D/g, '')}@phone.itin.local`;
