/**
 * Cookie utilities for secure token storage using js-cookie
 *
 * Note: Refresh tokens are managed server-side via httpOnly cookies
 * and cannot be accessed from client-side JavaScript.
 */
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export const cookieConfig = {
  // Cookie options for client-managed cookies
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
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

// Access token utilities (client-managed)
export const getAccessToken = (): string | undefined => {
  return Cookies.get("accessToken");
};

export const setAccessToken = (token: string): void => {
  const expiry = getTokenExpiry(token);
  Cookies.set("accessToken", token, {
    expires: expiry || undefined, // Use JWT expiry or session cookie
    secure: cookieConfig.secure,
    sameSite: cookieConfig.sameSite,
    path: cookieConfig.path,
  });
};

export const removeAccessToken = (): void => {
  Cookies.remove("accessToken", { path: cookieConfig.path });
};

// Remove all auth tokens (client-managed only - server httpOnly cookies handled separately)
export const removeAuthTokens = (): void => {
  removeAccessToken();
  // Note: refreshToken is httpOnly and managed by the server
  // The server will clear it when needed via Set-Cookie headers
};
