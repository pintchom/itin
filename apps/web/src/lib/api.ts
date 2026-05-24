import type { AppType } from '@itin/api/app';
import { hc } from 'hono/client';

const baseUrl = import.meta.env.VITE_API_ORIGIN ?? '';

const credentialedFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, credentials: 'include' });

export const api = hc<AppType>(baseUrl, { fetch: credentialedFetch });

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly issues?: Record<string, string[] | undefined>;

  constructor(
    status: number,
    code: string,
    message: string,
    issues?: Record<string, string[] | undefined>
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

export async function assertOk<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      throw new ApiError(res.status, 'http_error', res.statusText);
    }
    const error =
      (body as { error?: { code?: string; message?: string; issues?: Record<string, string[]> } })
        ?.error ?? {};
    throw new ApiError(
      res.status,
      error.code ?? 'http_error',
      error.message ?? res.statusText,
      error.issues
    );
  }
  return (await res.json()) as T;
}
