import type { UUID } from "crypto";
import crypto from "crypto";
import type { Request } from "express";
import z from "zod";
import { Ctx } from "../ctx";

// Reusable UUID schema
const uuidSchema = z.uuid();

export function setupRequestContext(req: Request) {
  const headerValue = req.headers["x-request-id"];

  let requestId: UUID;

  if (
    typeof headerValue === "string" &&
    uuidSchema.safeParse(headerValue).success
  ) {
    requestId = headerValue as UUID;
  } else {
    requestId = crypto.randomUUID();
  }

  Ctx.requestId = requestId;

  // TODO set later userId etc
}
