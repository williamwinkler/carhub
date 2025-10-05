import type { CookieOptions } from "express";

export type JwtTokens = {
  accessToken: string;
  refreshToken: string;
  refreshTokenCookieOptions: CookieOptions;
};
