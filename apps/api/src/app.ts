import { prisma } from '@itin/db';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './auth/better-auth.ts';
import type { Env } from './context.ts';
import { env } from './env.ts';
import { errorHandler } from './middleware/error.ts';
import { requestLogger } from './middleware/logger.ts';
import { loadSession } from './middleware/session.ts';
import { activityRoutes } from './routes/activities.ts';
import { authRoutes } from './routes/auth.ts';
import { healthRoutes } from './routes/health.ts';
import { imageRoutes } from './routes/images.ts';
import { inviteRoutes } from './routes/invites.ts';
import { partyRoutes } from './routes/parties.ts';

export const createApp = () => {
  const app = new Hono<Env>();

  app.use('*', requestLogger());
  app.use(
    '*',
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true,
      allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['content-type', 'authorization'],
    })
  );

  app.use('*', async (c, next) => {
    c.set('prisma', prisma);
    c.set('user', null);
    await next();
  });

  app.onError(errorHandler);

  app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

  app.use('/api/*', loadSession());

  app.use('/images/*', loadSession());

  const routes = app
    .route('/health', healthRoutes)
    .route('/images', imageRoutes)
    .basePath('/api')
    .route('/', authRoutes)
    .route('/parties', partyRoutes)
    .route('/parties', activityRoutes)
    .route('/', inviteRoutes);

  return routes;
};

const app = createApp();
export type AppType = typeof app;
export default app;
