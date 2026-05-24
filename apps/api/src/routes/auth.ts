import { zValidator } from '@hono/zod-validator';
import { type Context, Hono } from 'hono';
import { z } from 'zod';
import { auth } from '../auth/better-auth.ts';
import { devEmailFor, devPasswordFor } from '../auth/dev-credentials.ts';
import type { Env } from '../context.ts';
import { env } from '../env.ts';
import { Forbidden } from '../errors.ts';

const devLoginSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
});

const forwardSetCookie = async (c: Context<Env>, fn: () => Promise<Response>) => {
  const res = await fn();
  for (const value of res.headers.getSetCookie()) {
    c.header('set-cookie', value, { append: true });
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
  .get('/me', async (c) => {
    const user = c.get('user');
    return c.json({ user });
  });
