"use client";

import type { AppRouter } from "@api/modules/trpc/trpc.router";
import type { inferRouterOutputs } from "@trpc/server";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { trpc } from "../app/_trpc/client";
import { getRefreshToken, removeAuthTokens } from "./cookies";
import { setLogoutCallback } from "./token-refresh";

type RouterOutput = inferRouterOutputs<AppRouter>;
type User = RouterOutput["accounts"]["getMe"];

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// One-time localStorage cleanup (outside component to run only once)
if (typeof window !== "undefined") {
  if (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("refreshToken")
  ) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const utils = trpc.useUtils();
  const isCheckingAuth = useRef(false);

  const handleLogout = useCallback(() => {
    removeAuthTokens();
    setUser(null);
    utils.invalidate(); // Clear all cached queries
  }, [utils]);

  const handleLogin = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  // Initialize auth state and set up logout callback
  useEffect(() => {
    // Set the global logout callback for refresh-token-link
    setLogoutCallback(handleLogout);

    // Check if user is already logged in on mount
    const checkAuthState = async () => {
      if (isCheckingAuth.current) return;
      isCheckingAuth.current = true;

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          // Fetch user info - if access token is expired, refresh link will handle it
          const userInfo = await utils.accounts.getMe.fetch();
          setUser(userInfo);
        } catch (error) {
          // If this fails, the refresh-token-link already handled logout via callback
          console.error("Failed to fetch user info on mount:", error);
        }
      }

      setIsLoading(false);
      isCheckingAuth.current = false;
    };

    checkAuthState();
  }, [utils, handleLogout]);

  // Periodic check to detect manual cookie deletion
  // This is the ONLY case where we need polling - when user manually deletes cookies
  useEffect(() => {
    if (!user) return; // No need to check if not logged in

    const checkCookieDeletion = () => {
      const refreshToken = getRefreshToken();

      // If user is logged in but refresh token is gone, they manually deleted cookies
      if (!refreshToken) {
        console.log("Refresh token manually deleted, logging out");
        handleLogout();
      }
    };

    // Check every 30 seconds (only for manual cookie deletion detection)
    const interval = setInterval(checkCookieDeletion, 30000);

    return () => clearInterval(interval);
  }, [user, handleLogout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login: handleLogin,
        logout: handleLogout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
