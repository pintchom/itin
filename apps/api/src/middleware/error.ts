import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import type { Env } from '../context.ts';
import { AppError } from '../errors.ts';

export const errorHandler: ErrorHandler<Env> = (err, c) => {
  const requestId = c.get('requestId');

  if (err instanceof AppError) {
    return c.json({ error: { code: err.code, message: err.message }, requestId }, err.status);
  }

  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          code: 'validation_error',
          message: 'Invalid request',
          issues: err.flatten().fieldErrors,
        },
        requestId,
      },
      400
    );
  }

  if (err instanceof HTTPException) {
    return c.json({ error: { code: 'http_error', message: err.message }, requestId }, err.status);
  }

  console.error(`[${requestId}] unhandled error:`, err);
  return c.json(
    {
      error: { code: 'internal_error', message: 'Internal server error' },
      requestId,
    },
    500
  );
};
