import type { AppRouter } from "@repo/api-contract";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<AppRouter>();
