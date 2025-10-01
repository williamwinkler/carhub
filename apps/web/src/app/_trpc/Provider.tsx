"use client";

import type { AppRouter } from "@api/modules/trpc/trpc.router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCProxyClient } from "@trpc/client";
import { httpBatchLink } from "@trpc/react-query";
import { useState } from "react";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "../../lib/cookies";
import { refreshTokenLink } from "../../lib/refresh-token-link";
import { triggerLogout } from "../../lib/token-refresh";
import { trpc } from "./client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Create a separate client for token refresh without auth or interceptors
const refreshClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${apiUrl}/trpc`,
      // No authorization header - we're using the refresh token in the request body
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
        },
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        // Custom token refresh link - handles automatic token refresh on 401
        refreshTokenLink<AppRouter>({
          // Get the current refresh token from cookies
          getRefreshToken: () => {
            return getRefreshToken() ?? null;
          },

          // Fetch new JWT pair using the refresh token
          fetchJwtPairByRefreshToken: async (refreshToken) => {
            const tokens = await refreshClient.auth.refreshToken.mutate({
              refreshToken,
            });
            return tokens;
          },

          // Update storage with new JWT pair
          onJwtPairFetched: (tokens) => {
            setAccessToken(tokens.accessToken);
            setRefreshToken(tokens.refreshToken);
          },

          // Handle refresh failure - clear tokens and trigger logout
          onRefreshFailed: () => {
            triggerLogout();
          },
        }),

        // HTTP batch link for regular requests
        httpBatchLink({
          url: `${apiUrl}/trpc`,
          headers() {
            // Always get the current token from cookies (reactive to changes)
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
