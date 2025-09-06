import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { Ctx } from "../ctx";
import { setupContext } from "../utils/context.utils";

@Injectable()
export class ContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    setupContext(req);

    res.setHeader("x-request-id", Ctx.requestId);
    res.setHeader("x-correlation-id", Ctx.correlationId);

    next();
  }
}
