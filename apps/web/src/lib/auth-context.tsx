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

  const handleLogout = useCallback(() => {
    removeAuthTokens();
    setUser(null);
    utils.invalidate();
  }, [utils]);

  // Initialize auth state
  useEffect(() => {
    setLogoutCallback(handleLogout);

    const checkAuthState = async () => {
      if (!getAccessToken()) {
        setIsLoading(false);
        return;
      }

      try {
        const userInfo = await utils.accounts.getMe.fetch();
        setUser(userInfo);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();
  }, [utils, handleLogout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login: setUser,
        logout: handleLogout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
