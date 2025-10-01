import type { AppRouter } from "@api/modules/trpc/trpc.router";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<AppRouter>();
