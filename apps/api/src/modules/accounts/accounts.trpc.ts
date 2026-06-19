import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import { z } from "zod";
import type { AuthService } from "../auth/auth.service";
import type { TrpcService } from "../trpc/trpc.service";
import { usersFields } from "../users/users.schema";
import type { UsersService } from "../users/users.service";
import type { AccountsAdapter } from "./acounts.adapter";
import { accountSchema } from "./dto/account.dto";

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});
const getByUsernameSchema = z.object({ username: usersFields.username });
const apiKeyResponseSchema = z
  .object({ apiKey: z.string(), hasApiKey: z.boolean() })
  .strict();
const hasApiKeyResponseSchema = z.object({ hasApiKey: z.boolean() }).strict();

type AccountsRouterDeps = {
  trpc: TrpcService;
  usersService: UsersService;
  accountsAdapter: AccountsAdapter;
  authService: AuthService;
};

export function createAccountsRouter({
  trpc,
  usersService,
  accountsAdapter,
  authService,
}: AccountsRouterDeps) {
  return trpc.router({
    // Get current user profile
    getMe: trpc.protectedProcedure.output(accountSchema).query(async ({ ctx }) => {
      const user = await usersService.findById(ctx.principal.id);
      if (!user) {
        throw new AppError(Errors.USER_NOT_FOUND);
      }

      return accountsAdapter.getDto(user);
    }),

    // Update current user profile
    updateProfile: trpc.protectedProcedure
      .input(updateProfileSchema)
      .output(accountSchema)
      .mutation(async ({ input, ctx }) => {
        const updatedUser = await usersService.update(ctx.principal.id, input);

        return accountsAdapter.getDto(updatedUser);
      }),

    // Generate new API key
    generateApiKey: trpc.protectedProcedure
      .output(apiKeyResponseSchema)
      .mutation(async () => {
        const apiKey = await authService.createApiKey();

        return {
          apiKey,
          hasApiKey: true,
        };
      }),

    // Check if user has an API key
    hasApiKey: trpc.protectedProcedure
      .output(hasApiKeyResponseSchema)
      .query(async ({ ctx }) => {
        const user = await usersService.findById(ctx.principal.id, [
          "apiKeyLookupHash",
        ]);

        return {
          hasApiKey: !!user?.apiKeyLookupHash,
        };
      }),

    getByUsername: trpc.publicProcedure
      .input(getByUsernameSchema)
      .output(accountSchema)
      .query(async ({ input }) => {
        const user = await usersService.findByUsername(input.username);
        if (!user) {
          throw new AppError(Errors.USER_NOT_FOUND);
        }

        return accountsAdapter.getDto(user);
      }),
  });
}

export type AccountsRouter = ReturnType<typeof createAccountsRouter>;
