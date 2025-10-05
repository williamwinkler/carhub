import { QueryClient } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { cache } from "react";
import type { AppRouter } from "@api/modules/trpc/trpc.router";
import { trpc } from "./client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Create a singleton query client for server components
export const getQueryClient = cache(() => new QueryClient());

// Create tRPC server caller
export const serverTrpc = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${apiUrl}/trpc`,
    }),
  ],
});
