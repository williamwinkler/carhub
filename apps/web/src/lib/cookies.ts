/**
 * Cookie utilities for secure token storage using js-cookie
 */
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export const cookieConfig = {
  // Cookie options
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

const getTokenExpiry = (token: string): Date | null => {
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp) {
      return new Date(decoded.exp * 1000); // Convert from seconds to milliseconds
    }
    return null;
  } catch {
    return null;
  }
};

// Token-specific utilities using js-cookie
export const getAccessToken = (): string | undefined => {
  return Cookies.get('accessToken');
};

export const getRefreshToken = (): string | undefined => {
  return Cookies.get('refreshToken');
};

export const setAccessToken = (token: string): void => {
  const expiry = getTokenExpiry(token);
  Cookies.set('accessToken', token, {
    expires: expiry || undefined, // Use JWT expiry or session cookie
    secure: cookieConfig.secure,
    sameSite: cookieConfig.sameSite,
    path: cookieConfig.path,
  });
};

export const setRefreshToken = (token: string): void => {
  const expiry = getTokenExpiry(token);
  Cookies.set('refreshToken', token, {
    expires: expiry || 7, // Use JWT expiry or fallback to 7 days
    secure: cookieConfig.secure,
    sameSite: cookieConfig.sameSite,
    path: cookieConfig.path,
  });
};

export const removeAuthTokens = (): void => {
  Cookies.remove('accessToken', { path: cookieConfig.path });
  Cookies.remove('refreshToken', { path: cookieConfig.path });
};