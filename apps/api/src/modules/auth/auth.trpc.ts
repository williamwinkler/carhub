import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import { z } from "zod";
import type { TrpcService } from "../trpc/trpc.service";
import { REFRESH_TOKEN_COOKIE_NAME } from "./auth.consts";
import type { AuthService } from "./auth.service";
import { jwtSchema } from "./dto/jwt.dto";
import { loginSchema } from "./dto/login.dto";

const successSchema = z.object({ success: z.boolean() }).strict();

type AuthRouterDeps = {
  trpc: TrpcService;
  authService: AuthService;
};

export function createAuthRouter({ trpc, authService }: AuthRouterDeps) {
  return trpc.router({
    // Login - use short rate limit to prevent brute force attacks
    login: trpc.publicShortProcedure
      .input(loginSchema)
      .output(jwtSchema)
      .mutation(async ({ input, ctx }) => {
        const { accessToken, refreshToken, refreshTokenCookieOptions } =
          await authService.login(input.username, input.password);

        ctx.res.cookie(
          REFRESH_TOKEN_COOKIE_NAME,
          refreshToken,
          refreshTokenCookieOptions,
        );

        return { accessToken };
      }),

    // Logout - authenticated with default rate limiting
    logout: trpc.protectedProcedure.output(successSchema).mutation(async () => {
      await authService.logout();

      return { success: true };
    }),

    // Refresh token - use medium rate limit to prevent token abuse
    refreshToken: trpc.publicMediumProcedure
      .output(jwtSchema)
      .mutation(async ({ ctx }) => {
        const cookieRefreshToken = ctx.req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
        if (!cookieRefreshToken || typeof cookieRefreshToken !== "string") {
          throw new AppError(Errors.INVALID_REFRESH_TOKEN);
        }

        const { accessToken, refreshToken, refreshTokenCookieOptions } =
          await authService.refreshToken(cookieRefreshToken);

        ctx.res.cookie(
          REFRESH_TOKEN_COOKIE_NAME,
          refreshToken,
          refreshTokenCookieOptions,
        );

        return { accessToken };
      }),
  });
}

export type AuthRouter = ReturnType<typeof createAuthRouter>;
