import { Injectable } from "@nestjs/common";
import { TrpcService } from "../trpc/trpc.service";
import { AuthService } from "./auth.service";
import { loginSchema } from "./dto/login.dto";
import { refreshTokenSchema } from "./dto/refresh-token.dto";

@Injectable()
export class AuthTrpc {
  constructor(
    private readonly trpc: TrpcService,
    private readonly authService: AuthService,
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
  });
}
