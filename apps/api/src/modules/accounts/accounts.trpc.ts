import { Ctx } from "@api/common/ctx";
import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import { Injectable } from "@nestjs/common";
import z from "zod";
import { AuthService } from "../auth/auth.service";
import { TrpcService } from "../trpc/trpc.service";
import { usersFields } from "../users/users.schema";
import { UsersService } from "../users/users.service";
import { AccountsAdapter } from "./acounts.adapter";
import { AccountDto } from "./dto/account.dto";

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

    getByUsername: this.trpc.procedure
      .input(z.object({ username: usersFields.username }))
      .query(async ({ input: { username } }): Promise<AccountDto> => {
        const user = await this.usersService.findByUsername(username);
        if (!user) {
          throw new AppError(Errors.USER_NOT_FOUND);
        }

        return this.accountsAdapter.getDto(user);
      }),
  });
}
