/** Merge Set-Cookie headers from an auth response into a Headers bag for a follow-up auth API call. */
export const headersWithAuthCookies = (req: Request, authResponse: Response): Headers => {
  const headers = new Headers(req.headers);
  const parts: string[] = [];
  const existing = headers.get('cookie');
  if (existing) parts.push(existing);
  for (const setCookie of authResponse.headers.getSetCookie()) {
    const pair = setCookie.split(';')[0]?.trim();
    if (pair) parts.push(pair);
  }
  if (parts.length > 0) headers.set('cookie', parts.join('; '));
  return headers;
};

export const applySetCookiesToContext = (
  setCookie: (name: string, value: string, options?: { append?: boolean }) => void,
  response: Response
) => {
  for (const value of response.headers.getSetCookie()) {
    setCookie('set-cookie', value, { append: true });
  }
};
