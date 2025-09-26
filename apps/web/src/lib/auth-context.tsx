"use client";

import type { AppRouter } from "@api/modules/trpc/trpc.router";
import type { inferRouterOutputs } from "@trpc/server";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { trpc } from "../app/_trpc/client";
import { getAccessToken, removeAuthTokens } from "./cookies";
import { setLogoutCallback } from "./token-refresh";

type RouterOutput = inferRouterOutputs<AppRouter>;
type User = RouterOutput["auth"]["me"];

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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const utils = trpc.useUtils();

  const handleLogout = useCallback(() => {
    removeAuthTokens();
    setUser(null);
    utils.invalidate(); // Clear all cached queries
  }, [utils]);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  // Check for auth state changes - this will catch manual cookie deletion
  useEffect(() => {
    const checkAuthChanges = () => {
      const token = getAccessToken();
      if (!token && user) {
        // Token was cleared but user state still exists - logout immediately
        handleLogout();
      }
    };

    // Listen for storage events (cookie changes from other tabs)
    window.addEventListener("storage", checkAuthChanges);

    // Also check periodically but less frequently
    const interval = setInterval(checkAuthChanges, 3000);

    return () => {
      window.removeEventListener("storage", checkAuthChanges);
      clearInterval(interval);
    };
  }, [user, handleLogout]);

  useEffect(() => {
    // Set the global logout callback
    setLogoutCallback(handleLogout);

    // Check if user is already logged in on page load
    const checkAuthState = async () => {
      // Clear any existing localStorage tokens (migration from old implementation)
      if (typeof window !== "undefined") {
        if (
          localStorage.getItem("accessToken") ||
          localStorage.getItem("refreshToken")
        ) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      }

      const token = getAccessToken();
      if (token) {
        try {
          const userInfo = await utils.auth.me.fetch();
          setUser(userInfo);
        } catch (error) {
          // Token might be expired, clear cookies
          removeAuthTokens();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuthState();
  }, [utils, handleLogout]);

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
