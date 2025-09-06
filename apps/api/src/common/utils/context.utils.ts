import type { UUID } from "crypto";
import crypto from "crypto";
import type { Request } from "express";
import z from "zod";
import { Ctx } from "../ctx";

const uuidSchema = z.uuid().transform((uuid) => uuid as UUID);

export function setupContext(req: Request): void {
  const requestIdHeader = req.headers["x-request-id"];
  const correlationIdHeader = req.headers["x-correlation-id"];

  Ctx.requestId =
    uuidSchema.safeParse(requestIdHeader).data ?? crypto.randomUUID();

  Ctx.correlationId =
    uuidSchema.safeParse(correlationIdHeader).data ?? crypto.randomUUID();
}
