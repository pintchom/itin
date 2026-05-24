import app from './app.ts';
import { env } from './env.ts';

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
  idleTimeout: 30,
});

console.log(`itin api listening on ${server.url.toString()}`);
