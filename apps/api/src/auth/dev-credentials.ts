import { env } from '../env.ts';

const encoder = new TextEncoder();

const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'user';

export const devEmailFor = (firstName: string, lastName: string) =>
  `${slugify(firstName)}.${slugify(lastName)}@itin.local`;

export const devPasswordFor = async (email: string) => {
  const data = encoder.encode(`${env.AUTH_SECRET}::${email}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(digest).toString('base64url');
};
