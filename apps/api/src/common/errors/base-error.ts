import type { HttpStatus } from "@nestjs/common";
import { HttpException } from "@nestjs/common";
import type { ErrorCode } from "./error-codes.enum";

export interface BaseErrorOptions {
  message: string;
  errorCode: ErrorCode;
  status: HttpStatus;
  details?: unknown;
}

export abstract class BaseError extends HttpException {
  readonly errorCode: ErrorCode;
  readonly details?: unknown;

  constructor({ message, errorCode, status, details }: BaseErrorOptions) {
    super(
      {
        statusCode: status,
        errorCode,
        message,
        details,
      },
      status,
    );

    this.errorCode = errorCode;
    this.details = details;
  }
}
