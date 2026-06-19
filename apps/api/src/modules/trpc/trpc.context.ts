import type { Principal } from "@api/common/ctx";
import type { AppErrorBody } from "@api/common/errors/app-error";
import { AppError } from "@api/common/errors/app-error";
import { AuthService } from "@api/modules/auth/auth.service";
import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { Request, Response } from "express";
import { httpStatusToTrpcCode } from "./trpc.consts";

export type TrpcContext = {
  req: Request;
  res: Response;
  principal: Principal | null;
};

@Injectable()
export class TrpcContextFactory {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async create(opts: CreateExpressContextOptions): Promise<TrpcContext> {
    const req = opts.req as Request;
    const res = opts.res as Response;
    const authorization = req.headers.authorization;

    let principal: Principal | null = null;
    if (authorization?.startsWith("Bearer ")) {
      try {
        const token = authorization.slice(7);
        const payload = await this.authService.verifyAccessToken(token);
        principal = this.authService.principalFromJwt(payload);
      } catch (error) {
        if (error instanceof AppError) {
          const httpStatus = error.getStatus() ?? HttpStatus.UNAUTHORIZED;
          const appErrorResponse = error.getResponse() as AppErrorBody;

          throw new TRPCError({
            code: httpStatusToTrpcCode[httpStatus] ?? "UNAUTHORIZED",
            message: appErrorResponse.message,
            cause: {
              errorCode: appErrorResponse.errorCode,
              errors: appErrorResponse.errors,
            },
          });
        }

        throw error;
      }
    }

    return { req, res, principal };
  }
}
