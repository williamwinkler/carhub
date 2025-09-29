import { Injectable } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { TrpcService } from "../trpc/trpc.service";
import { UsersService } from "../users/users.service";
import { AccountsAdapter } from "./acounts.adapter";
import { Ctx } from "@api/common/ctx";
import z from "zod";

@Injectable()
export class AccountsTrpc {
  constructor(
    private readonly trpc: TrpcService,
    private readonly usersService: UsersService,
    private readonly accountsAdapter: AccountsAdapter,
    private readonly authService: AuthService,
  ) {}

  router = this.trpc.router({
    // Get current user profile
    getMe: this.trpc.authenticatedProcedure.query(async () => {
      const userId = Ctx.userIdRequired();
      const user = await this.usersService.findById(userId);

      return this.accountsAdapter.getDto(user!);
    }),

    // Update current user profile
    updateProfile: this.trpc.authenticatedProcedure
      .input(
        z.object({
          firstName: z.string().min(1).max(100),
          lastName: z.string().min(1).max(100),
        }),
      )
      .mutation(async ({ input }) => {
        const userId = Ctx.userIdRequired();
        const updatedUser = await this.usersService.update(userId, input);

        return this.accountsAdapter.getDto(updatedUser);
      }),

    // Generate new API key
    generateApiKey: this.trpc.authenticatedProcedure.mutation(async () => {
      const apiKey = await this.authService.createApiKey();

      return {
        apiKey,
        hasApiKey: true,
      };
    }),

    // Check if user has an API key
    hasApiKey: this.trpc.authenticatedProcedure.query(async () => {
      const userId = Ctx.userIdRequired();
      const user = await this.usersService.findById(userId, [
        "apiKeyLookupHash",
      ]);

      return {
        hasApiKey: !!user?.apiKeyLookupHash,
      };
    }),
  });
}
