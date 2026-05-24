import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class AppError extends Error {
  readonly status: ContentfulStatusCode;
  readonly code: string;

  constructor(status: ContentfulStatusCode, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const NotFound = (message = 'Not found') => new AppError(404, 'not_found', message);

export const Unauthorized = (message = 'Authentication required') =>
  new AppError(401, 'unauthorized', message);

export const Forbidden = (message = 'Forbidden') => new AppError(403, 'forbidden', message);

export const BadRequest = (message = 'Bad request') => new AppError(400, 'bad_request', message);

export const Conflict = (message = 'Conflict') => new AppError(409, 'conflict', message);
