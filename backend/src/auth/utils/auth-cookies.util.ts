import { Response } from 'express';

export const ACCESS_TOKEN_MAX_AGE_MS = 1000 * 60 * 15; // mirrors the access JWT's 15m expiry

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: false, // TODO true in prod (HTTPS)
};

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  refreshTokenExpiresAt: Date,
) {
  res.cookie('access_token', accessToken, {
    ...COOKIE_BASE,
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });

  res.cookie('refresh_token', refreshToken, {
    ...COOKIE_BASE,
    maxAge: refreshTokenExpiresAt.getTime() - Date.now(),
    path: '/auth', // only sent back for login/refresh/logout, not every API call
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', COOKIE_BASE);
  res.clearCookie('refresh_token', { ...COOKIE_BASE, path: '/auth' });
}
