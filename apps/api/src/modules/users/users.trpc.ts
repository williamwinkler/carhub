import { UsersAdapter } from "@api/modules/users/users.adapter";
// src/modules/users/users.trpc.ts
import { Ctx } from "@api/common/ctx";
import { Injectable } from "@nestjs/common";
import { z } from "zod";
import { AuthService } from "../auth/auth.service";
import { TrpcService } from "../trpc/trpc.service";
import { UsersService } from "./users.service";

// Schema for updating user profile
const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});

@Injectable()
export class UsersTrpc {
  constructor(
    private readonly trpc: TrpcService,
    private readonly usersService: UsersService,
    private readonly usersAdapter: UsersAdapter,
    private readonly authService: AuthService,
  ) {}

  router = this.trpc.router({
    // Get current user profile
    getMe: this.trpc.authenticatedProcedure.query(async () => {
      const userId = Ctx.userIdRequired();
      const user = await this.usersService.findById(userId);
      return this.usersAdapter.getUserDto(user!);
    }),

    // Update current user profile
    updateProfile: this.trpc.authenticatedProcedure
      .input(updateProfileSchema)
      .mutation(async ({ input }) => {
        const userId = Ctx.userIdRequired();
        const updatedUser = await this.usersService.update(userId, input);
        return this.usersAdapter.getUserDto(updatedUser);
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
      const user = await this.usersService.findById(userId, ['apiKeyLookupHash']);

      return {
        hasApiKey: !!user?.apiKeyLookupHash,
      };
    }),
  });
}
