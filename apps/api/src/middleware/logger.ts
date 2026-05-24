import type { MiddlewareHandler } from 'hono';
import type { Env } from '../context.ts';

export const requestLogger = (): MiddlewareHandler<Env> => async (c, next) => {
  const requestId =
    c.req.header('x-request-id') ??
    globalThis.crypto?.randomUUID?.() ??
    Math.random().toString(36).slice(2);
  c.set('requestId', requestId);

  const start = performance.now();
  await next();
  const ms = (performance.now() - start).toFixed(1);

  const status = c.res.status;
  const method = c.req.method;
  const path = new URL(c.req.url).pathname;
  console.log(`[${requestId}] ${method} ${path} ${status} ${ms}ms`);
};
