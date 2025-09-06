import { HttpStatus } from "@nestjs/common";
import type { TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc";

export const httpStatusToTrpcCode: Record<number, TRPC_ERROR_CODE_KEY> = {
  [HttpStatus.BAD_REQUEST]: "BAD_REQUEST",
  [HttpStatus.UNAUTHORIZED]: "UNAUTHORIZED",
  [HttpStatus.FORBIDDEN]: "FORBIDDEN",
  [HttpStatus.NOT_FOUND]: "NOT_FOUND",
  [HttpStatus.CONFLICT]: "CONFLICT",
  [HttpStatus.PAYLOAD_TOO_LARGE]: "PAYLOAD_TOO_LARGE",
  [HttpStatus.TOO_MANY_REQUESTS]: "TOO_MANY_REQUESTS",
  [HttpStatus.REQUEST_TIMEOUT]: "TIMEOUT",
  [HttpStatus.PRECONDITION_FAILED]: "PRECONDITION_FAILED",
  [HttpStatus.METHOD_NOT_ALLOWED]: "METHOD_NOT_SUPPORTED",
  // fallback
  [HttpStatus.INTERNAL_SERVER_ERROR]: "INTERNAL_SERVER_ERROR",
};
