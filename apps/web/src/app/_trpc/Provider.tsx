"use client";

import type { AppRouter } from "@api/modules/trpc/trpc.router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCProxyClient, TRPCClientError } from "@trpc/client";
import { httpBatchLink } from "@trpc/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { getAccessToken, setAccessToken } from "../../lib/cookies";
import { refreshTokenLink } from "../../lib/refresh-token-link";
import { triggerLogout } from "../../lib/token-refresh";
import { trpc } from "./client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Separate client for token refresh (no auth header)
const refreshClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${apiUrl}/trpc`,
      fetch(url, options) {
        return fetch(url, { ...options, credentials: "include" });
      },
    }),
  ],
});

export default function Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            placeholderData: (prev: never) => prev,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
          mutations: {
            onError: (error) => {
              // Show toast for all tRPC errors except UNAUTHORIZED
              if (error instanceof TRPCClientError) {
                const errorCode = error.data?.code;
                if (errorCode !== "UNAUTHORIZED") {
                  toast.error(error.message || "An error occurred");
                }
              }
            },
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        // Auto-refresh access token on 401 errors
        refreshTokenLink<AppRouter>({
          refreshAccessToken: async () => {
            // Server reads httpOnly refresh token cookie automatically
            const { accessToken } = await refreshClient.auth.refreshToken.mutate();
            return { accessToken };
          },
          onAccessTokenRefreshed: setAccessToken,
          onRefreshFailed: triggerLogout,
        }),

        // Regular requests with credentials
        httpBatchLink({
          url: `${apiUrl}/trpc`,
          fetch(url, options) {
            return fetch(url, { ...options, credentials: "include" });
          },
          headers() {
            const token = getAccessToken();
            return token ? { authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
