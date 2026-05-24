import type { MiddlewareHandler } from 'hono';
import { auth } from '../auth/better-auth.ts';
import type { Env, SessionUser } from '../context.ts';
import { Unauthorized } from '../errors.ts';

export const loadSession = (): MiddlewareHandler<Env> => async (c, next) => {
  const result = await auth.api.getSession({ headers: c.req.raw.headers });
  if (result?.user) {
    const u = result.user as {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      profileImageKey?: string | null;
    };
    const sessionUser: SessionUser = {
      id: u.id,
      firstName: u.firstName ?? null,
      lastName: u.lastName ?? null,
      email: u.email ?? null,
      profileImageKey: u.profileImageKey ?? null,
    };
    c.set('user', sessionUser);
  }
  await next();
};

export const requireAuth = (): MiddlewareHandler<Env> => async (c, next) => {
  const user = c.get('user');
  if (!user) throw Unauthorized();
  await next();
};
