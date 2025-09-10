/**
 * Token refresh utilities for handling expired access tokens
 */
import { getRefreshToken, setAccessToken, setRefreshToken, removeAuthTokens } from './cookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const refreshTokens = async (): Promise<{ accessToken: string; refreshToken: string } | null> => {
  const currentRefreshToken = getRefreshToken();
  
  if (!currentRefreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/trpc/auth.refreshToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: currentRefreshToken,
      }),
    });

    if (!response.ok) {
      // Refresh token is invalid, clear all tokens
      removeAuthTokens();
      return null;
    }

    const data = await response.json();
    const tokens = data.result?.data;

    if (tokens?.accessToken && tokens?.refreshToken) {
      // Store the new tokens with proper JWT expiry
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      return tokens;
    }

    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    removeAuthTokens();
    return null;
  }
};