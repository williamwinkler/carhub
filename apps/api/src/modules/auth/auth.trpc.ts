import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import { Injectable } from "@nestjs/common";
import { TrpcService } from "../trpc/trpc.service";
import { REFRESH_TOKEN_COOKIE_NAME } from "./auth.consts";
import { AuthService } from "./auth.service";
import { JwtDto } from "./dto/jwt.dto";
import { loginSchema } from "./dto/login.dto";

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
      .mutation(async ({ input, ctx }): Promise<JwtDto> => {
        // Authenticate and generate tokens
        const { accessToken, refreshToken, refreshTokenCookieOptions } =
          await this.authService.login(input.username, input.password);

        ctx.res.cookie(
          REFRESH_TOKEN_COOKIE_NAME,
          refreshToken,
          refreshTokenCookieOptions,
        );

        return { accessToken };
      }),

    // Logout - authenticated with default rate limiting
    logout: this.trpc.authenticatedProcedure.mutation(async () => {
      await this.authService.logout();

      return { success: true };
    }),

    // Refresh token - use medium rate limit to prevent token abuse
    refreshToken: this.trpc.mediumRateLimitProcedure.mutation(
      async ({ ctx }): Promise<JwtDto> => {
        // Get refresh token from cookie
        const cookieRefreshToken = ctx.req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
        if (!cookieRefreshToken || typeof cookieRefreshToken !== "string") {
          throw new AppError(Errors.INVALID_REFRESH_TOKEN);
        }

        // Authenticate and generate new tokens
        const { accessToken, refreshToken, refreshTokenCookieOptions } =
          await this.authService.refreshToken(cookieRefreshToken);

        ctx.res.cookie(
          REFRESH_TOKEN_COOKIE_NAME,
          refreshToken,
          refreshTokenCookieOptions,
        );

        return { accessToken };
      },
    ),
  });
}
