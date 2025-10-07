/**
 * Cookie utilities for secure token storage using js-cookie
 *
 * Note: Refresh tokens are managed server-side via httpOnly cookies
 * and cannot be accessed from client-side JavaScript.
 */
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { User } from "../app/_trpc/types";

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

export const getUser = (): User | null => {
  const userStr = Cookies.get("user");
  // Ideally we would validate the user object with zod here, but demo...
  return (userStr && JSON.parse(userStr)) ?? null;
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

export const removeUserCookies = (): void => {
  Cookies.remove("accessToken");
  Cookies.remove("user");
};

export const setUserCookie = (user: User) => {
  Cookies.set("user", JSON.stringify(user));
};
