import { QueryClient } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { cache } from "react";
import { cookies } from "next/headers";
import type { AppRouter } from "@api/modules/trpc/trpc.router";
import { trpc } from "./client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Create a singleton query client for server components
export const getQueryClient = cache(() => new QueryClient());

// Create tRPC server caller with authentication
export const getServerTrpc = cache(async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${apiUrl}/trpc`,
        headers: () => {
          return {
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          };
        },
      }),
    ],
  });
});
