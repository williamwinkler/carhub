/**
 * Token refresh utilities for handling expired access tokens
 */
import toast from "react-hot-toast";
import { removeUserCookies } from "./cookies";

// Global logout callback - set by the auth provider
let globalLogoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  globalLogoutCallback = callback;
};

/**
 * Trigger logout - clears tokens and calls global logout callback
 * This is now used by the refreshTokenLink in Provider.tsx
 */
export const triggerLogout = () => {
  removeUserCookies();
  if (globalLogoutCallback) {
    globalLogoutCallback();
  }
  // Show toast notification
  toast.error("Session expired. Please log in again.");
};
