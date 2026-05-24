import { zValidator } from '@hono/zod-validator';
import {
  emailPasswordSignInSchema,
  emailPasswordSignUpSchema,
  phoneSendOtpSchema,
  phoneSignInSchema,
  phoneSignUpSchema,
  updateProfileSchema,
} from '@itin/shared/schemas/user';
import { type Context, Hono } from 'hono';
import { z } from 'zod';
import { auth } from '../auth/better-auth.ts';
import { applySetCookiesToContext, headersWithAuthCookies } from '../auth/cookies.ts';
import { devEmailFor, devPasswordFor } from '../auth/dev-credentials.ts';
import { normalizePhoneNumber } from '../auth/phone-otp.ts';
import type { Env } from '../context.ts';
import { env } from '../env.ts';
import { BadRequest, Forbidden } from '../errors.ts';
import { isValidImageKey } from '../lib/images.ts';
import { requireAuth } from '../middleware/session.ts';

const devLoginSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
});

const forwardSetCookie = async (c: Context<Env>, fn: () => Promise<Response>) => {
  const res = await fn();
  for (const value of res.headers.getSetCookie()) {
    c.header('set-cookie', value, { append: true });
  }
  return res;
};

const forwardAuthResponse = async (c: Context<Env>, res: Response) => {
  applySetCookiesToContext((name, value, opts) => c.header(name, value, opts), res);
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw BadRequest(message);
  }
};

export const authRoutes = new Hono<Env>()
  .post('/dev-login', zValidator('json', devLoginSchema), async (c) => {
    if (!env.DEV_AUTH_ENABLED) throw Forbidden('Dev auth disabled');

    const prisma = c.get('prisma');
    const { firstName, lastName } = c.req.valid('json');

    const email = devEmailFor(firstName, lastName);
    const password = await devPasswordFor(email);
    const name = `${firstName} ${lastName}`;

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });

    await forwardSetCookie(c, () =>
      existing
        ? auth.api.signInEmail({
            body: { email, password },
            headers: c.req.raw.headers,
            asResponse: true,
          })
        : auth.api.signUpEmail({
            body: { email, password, name, firstName, lastName },
            headers: c.req.raw.headers,
            asResponse: true,
          })
    );

    return c.json({ ok: true });
  })
  .post('/email/sign-up', zValidator('json', emailPasswordSignUpSchema), async (c) => {
    const { email, password, firstName, lastName } = c.req.valid('json');
    const name = `${firstName} ${lastName}`;

    await forwardSetCookie(c, () =>
      auth.api.signUpEmail({
        body: { email, password, name, firstName, lastName },
        headers: c.req.raw.headers,
        asResponse: true,
      })
    );

    return c.json({ ok: true });
  })
  .post('/email/sign-in', zValidator('json', emailPasswordSignInSchema), async (c) => {
    const { email, password } = c.req.valid('json');

    await forwardSetCookie(c, () =>
      auth.api.signInEmail({
        body: { email, password },
        headers: c.req.raw.headers,
        asResponse: true,
      })
    );

    return c.json({ ok: true });
  })
  .post('/phone/send-otp', zValidator('json', phoneSendOtpSchema), async (c) => {
    const phoneNumber = normalizePhoneNumber(c.req.valid('json').phoneNumber);

    const res = await auth.api.sendPhoneNumberOTP({
      body: { phoneNumber },
      headers: c.req.raw.headers,
      asResponse: true,
    });
    await forwardAuthResponse(c, res);

    return c.json({ ok: true });
  })
  .post('/phone/sign-up', zValidator('json', phoneSignUpSchema), async (c) => {
    const { code, password, firstName, lastName } = c.req.valid('json');
    const phoneNumber = normalizePhoneNumber(c.req.valid('json').phoneNumber);

    const verifyRes = await auth.api.verifyPhoneNumber({
      body: { phoneNumber, code, firstName, lastName },
      headers: c.req.raw.headers,
      asResponse: true,
    });
    await forwardAuthResponse(c, verifyRes);

    const headers = headersWithAuthCookies(c.req.raw, verifyRes);

    const setRes = await auth.api.setPassword({
      body: { newPassword: password },
      headers,
      asResponse: true,
    });
    await forwardAuthResponse(c, setRes);

    const prisma = c.get('prisma');
    const session = await auth.api.getSession({ headers });
    if (session?.user?.id) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
        },
      });
    }

    return c.json({ ok: true });
  })
  .post('/phone/sign-in', zValidator('json', phoneSignInSchema), async (c) => {
    const { password } = c.req.valid('json');
    const phoneNumber = normalizePhoneNumber(c.req.valid('json').phoneNumber);

    await forwardSetCookie(c, () =>
      auth.api.signInPhoneNumber({
        body: { phoneNumber, password },
        headers: c.req.raw.headers,
        asResponse: true,
      })
    );

    return c.json({ ok: true });
  })
  .get('/me', async (c) => {
    const user = c.get('user');
    return c.json({ user });
  })
  .patch('/me', requireAuth(), zValidator('json', updateProfileSchema), async (c) => {
    const user = c.get('user');
    if (!user) throw Forbidden();

    const body = c.req.valid('json');
    if (body.profileImageKey != null && !isValidImageKey(body.profileImageKey)) {
      throw BadRequest('Invalid profile image key');
    }

    const prisma = c.get('prisma');
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        name: `${body.firstName} ${body.lastName}`,
        ...(body.profileImageKey !== undefined ? { profileImageKey: body.profileImageKey } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profileImageKey: true,
        phoneNumber: true,
        phoneNumberVerified: true,
      },
    });

    return c.json({
      user: {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        profileImageKey: updated.profileImageKey,
        phoneNumber: updated.phoneNumber,
        phoneNumberVerified: updated.phoneNumberVerified,
      },
    });
  });
