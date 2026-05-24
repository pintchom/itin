import { Hono } from 'hono';
import type { Env } from '../context.ts';

export const healthRoutes = new Hono<Env>().get('/', (c) =>
  c.json({ status: 'ok', uptime: process.uptime() })
);
