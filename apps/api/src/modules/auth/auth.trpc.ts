import { Ctx } from "@api/common/ctx";
import { Injectable } from "@nestjs/common";
import { TrpcService } from "../trpc/trpc.service";
import { UsersService } from "../users/users.service";
import { AuthService } from "./auth.service";
import { loginSchema } from "./dto/login.dto";
import { refreshTokenSchema } from "./dto/refresh-token.dto";

@Injectable()
export class AuthTrpc {
  constructor(
    private readonly trpc: TrpcService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  router = this.trpc.router({
    // Login - use short rate limit to prevent brute force attacks
    login: this.trpc.shortRateLimitProcedure
      .input(loginSchema)
      .mutation(async ({ input }) => {
        return await this.authService.login(input.username, input.password);
      }),

    // Logout - authenticated with default rate limiting
    logout: this.trpc.authenticatedProcedure.mutation(async () => {
      await this.authService.logout();

      return { success: true };
    }),

    // Refresh token - use medium rate limit to prevent token abuse
    refreshToken: this.trpc.authenticatedMediumProcedure
      .input(refreshTokenSchema)
      .mutation(async ({ input }) => {
        return await this.authService.refreshTokens(input.refreshToken);
      }),

    // Current user info - authenticated with default rate limiting
    me: this.trpc.authenticatedProcedure.query(async () => {
      const userId = Ctx.userIdRequired();
      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Don't return sensitive fields
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, apiKey, ...safeUser } = user;

      return safeUser;
    }),
  });
}
