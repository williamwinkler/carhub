import type { Principal } from "@api/common/ctx";
import { AuthService } from "@api/modules/auth/auth.service";
import { Inject, Injectable } from "@nestjs/common";
import type { Request, Response } from "express";
import type { ContextOptions, TRPCContext } from "nestjs-trpc";

export type TrpcContext = {
  req: Request;
  res: Response;
  principal: Principal | null;
};

@Injectable()
export class TrpcContextFactory implements TRPCContext {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async create(opts: ContextOptions): Promise<TrpcContext> {
    const req = opts.req as Request;
    const res = opts.res as Response;
    const authorization = req.headers.authorization;

    let principal: Principal | null = null;
    if (authorization?.startsWith("Bearer ")) {
      const token = authorization.slice(7);
      const payload = await this.authService.verifyAccessToken(token);
      principal = this.authService.principalFromJwt(payload);
    }

    return { req, res, principal };
  }
}
