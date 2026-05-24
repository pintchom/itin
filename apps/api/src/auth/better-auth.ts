import { prisma } from '@itin/db';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { env, googleConfigured } from '../env.ts';

export const auth = betterAuth({
  appName: 'itin',
  secret: env.AUTH_SECRET,
  baseURL: env.AUTH_URL ?? env.API_ORIGIN,
  basePath: '/api/auth',
  trustedOrigins: [env.WEB_ORIGIN],
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    disableSignUp: false,
    requireEmailVerification: false,
  },
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          mapProfileToUser: (profile) => ({
            firstName: profile.given_name ?? null,
            lastName: profile.family_name ?? null,
          }),
        },
      }
    : {},
  user: {
    additionalFields: {
      firstName: { type: 'string', required: false, input: true },
      lastName: { type: 'string', required: false, input: true },
      profileImageKey: { type: 'string', required: false, input: false },
    },
  },
  advanced: {
    cookiePrefix: 'itin',
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
