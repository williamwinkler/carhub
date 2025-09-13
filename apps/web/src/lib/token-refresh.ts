/**
 * Token refresh utilities for handling expired access tokens
 */
import toast from "react-hot-toast";
import {
  getRefreshToken,
  removeAuthTokens,
  setAccessToken,
  setRefreshToken,
} from "./cookies";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Global logout callback - set by the auth provider
let globalLogoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  globalLogoutCallback = callback;
};

const triggerLogout = () => {
  removeAuthTokens();
  if (globalLogoutCallback) {
    globalLogoutCallback();
  }
  // Show toast notification
  toast.error("Session expired. Please log in again.");
};

export const refreshTokens = async (): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> => {
  const currentRefreshToken = getRefreshToken();

  if (!currentRefreshToken) {
    triggerLogout();
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/trpc/auth.refreshToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: currentRefreshToken,
      }),
    });

    if (!response.ok) {
      // Refresh token is invalid, trigger full logout
      triggerLogout();
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

    triggerLogout();
    return null;
  } catch (error) {
    console.error("Token refresh failed:", error);
    triggerLogout();
    return null;
  }
};
