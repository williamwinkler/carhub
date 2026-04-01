import { useState } from "react";
import toast from "react-hot-toast";
import { setAccessToken } from "../lib/cookies";
import { trpc } from "../app/_trpc/client";
import { User } from "../app/_trpc/types";

interface UseLoginOptions {
  onSuccess?: (user: User) => void;
  onError?: (error: unknown) => void;
}

export function useLogin(options: UseLoginOptions = {}) {
  const { onSuccess, onError } = options;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [hasError, setHasError] = useState(false);

  const loginMutation = trpc.auth.login.useMutation();
  const utils = trpc.useUtils();

  const handleLogin = async () => {
    // Don't submit if fields are empty
    if (!username.trim() || !password.trim()) {
      return;
    }

    setHasError(false);

    try {
      const result = await loginMutation.mutateAsync({ username, password });

      // Store access token (refresh token set by API via httpOnly cookie)
      setAccessToken(result.accessToken);

      // Get user info using utils to fetch fresh data
      const userInfo = await utils.accounts.getMe.fetch();

      // Reset form
      setUsername("");
      setPassword("");
      setHasError(false);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(userInfo);
      }

      toast.success(`Welcome back, ${userInfo.firstName}!`, {
        duration: 4000,
        style: {
          background: "#1e293b",
          color: "#f1f5f9",
          border: "1px solid #475569",
        },
        iconTheme: {
          primary: "#22c55e",
          secondary: "#1e293b",
        },
      });

      return userInfo;
    } catch (error: unknown) {
      setHasError(true);

      // Auto-clear error state after animation
      setTimeout(() => setHasError(false), 3000);

      // Call error callback if provided
      if (onError) {
        onError(error);
      } else {
        // Default error handling
        const errorMessage =
          error instanceof Error ? error.message : "Login failed";
        toast.error(errorMessage);
      }

      throw error;
    }
  };

  const reset = () => {
    setUsername("");
    setPassword("");
    setHasError(false);
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    hasError,
    setHasError,
    handleLogin,
    reset,
    isLoading: loginMutation.isPending,
  };
}
