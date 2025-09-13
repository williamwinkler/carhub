"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/react-query";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../../lib/auth-context";
import { getAccessToken } from "../../lib/cookies";
import { refreshTokens } from "../../lib/token-refresh";
import { trpc } from "./client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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
        httpBatchLink({
          url: `${apiUrl}/trpc`,
          headers() {
            // Always get the current token from cookies (reactive to changes)
            const token = getAccessToken();
            return token ? { authorization: `Bearer ${token}` } : {};
          },
          async fetch(url, options) {
            const response = await fetch(url, options);

            // If we get a 401, try to refresh the token and retry
            if (response.status === 401) {
              const newTokens = await refreshTokens();
              if (newTokens) {
                // Retry the request with the new token
                const retryOptions = {
                  ...options,
                  headers: {
                    ...options?.headers,
                    authorization: `Bearer ${newTokens.accessToken}`,
                  },
                };
                return fetch(url, retryOptions);
              } else {
                // Refresh failed - tokens are cleared and logout callback was triggered
                // We still need to return the 401 response so tRPC can handle it properly
                return response;
              }
            }

            return response;
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#1e293b",
                color: "#f1f5f9",
                border: "1px solid #475569",
                borderRadius: "8px",
                fontSize: "14px",
              },
              success: {
                iconTheme: {
                  primary: "#22c55e",
                  secondary: "#1e293b",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#1e293b",
                },
                style: {
                  background: "#1e293b",
                  color: "#f1f5f9",
                  border: "1px solid #ef4444",
                },
              },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
