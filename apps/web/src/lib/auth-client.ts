import { phoneNumberClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

/** Same-origin client; Vite proxies `/api/auth` to the API in dev. */
export const authClient = createAuthClient({
  basePath: '/api/auth',
  plugins: [phoneNumberClient()],
});
