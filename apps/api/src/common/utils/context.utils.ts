import type { UUID } from "crypto";
import crypto from "crypto";
import type { Request } from "express";
import z from "zod";
import { Ctx } from "../ctx";

const uuid = z.uuid().transform((uuid) => uuid as UUID);

export function setupContext(req: Request): void {
  const requestIdHeader = req.headers["x-request-id"];
  const correlationIdHeader = req.headers["x-correlation-id"];

  Ctx.requestId =
    uuid.safeParse(requestIdHeader).data ?? crypto.randomUUID();

  Ctx.correlationId =
    uuid.safeParse(correlationIdHeader).data ?? crypto.randomUUID();
}
