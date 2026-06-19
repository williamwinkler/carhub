import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import { Inject, Injectable } from "@nestjs/common";
import {
  Ctx as TrpcCtx,
  Input,
  Mutation,
  Router,
  UseMiddlewares,
} from "nestjs-trpc";
import { z } from "zod";
import type { TrpcContext } from "../trpc/trpc.context";
import {
  TrpcAuthMiddleware,
  TrpcMediumRateLimitMiddleware,
  TrpcShortRateLimitMiddleware,
} from "../trpc/trpc.middlewares";
import { REFRESH_TOKEN_COOKIE_NAME } from "./auth.consts";
import { AuthService } from "./auth.service";
import { jwtSchema, type JwtDto } from "./dto/jwt.dto";
import { loginSchema, type LoginDto } from "./dto/login.dto";

const successSchema = z.object({ success: z.boolean() }).strict();

@Router({ alias: "auth" })
@Injectable()
export class AuthTrpc {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  // Login - use short rate limit to prevent brute force attacks
  @UseMiddlewares(TrpcShortRateLimitMiddleware)
  @Mutation({ input: loginSchema, output: jwtSchema })
  async login(
    @Input() input: LoginDto,
    @TrpcCtx() ctx: TrpcContext,
  ): Promise<JwtDto> {
    const { accessToken, refreshToken, refreshTokenCookieOptions } =
      await this.authService.login(input.username, input.password);

    ctx.res.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      refreshToken,
      refreshTokenCookieOptions,
    );

    return { accessToken };
  }

  // Logout - authenticated with default rate limiting
  @UseMiddlewares(TrpcAuthMiddleware)
  @Mutation({ output: successSchema })
  async logout(): Promise<{ success: boolean }> {
    await this.authService.logout();

    return { success: true };
  }

  // Refresh token - use medium rate limit to prevent token abuse
  @UseMiddlewares(TrpcMediumRateLimitMiddleware)
  @Mutation({ output: jwtSchema })
  async refreshToken(@TrpcCtx() ctx: TrpcContext): Promise<JwtDto> {
    const cookieRefreshToken = ctx.req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (!cookieRefreshToken || typeof cookieRefreshToken !== "string") {
      throw new AppError(Errors.INVALID_REFRESH_TOKEN);
    }

    const { accessToken, refreshToken, refreshTokenCookieOptions } =
      await this.authService.refreshToken(cookieRefreshToken);

    ctx.res.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      refreshToken,
      refreshTokenCookieOptions,
    );

    return { accessToken };
  }
}
