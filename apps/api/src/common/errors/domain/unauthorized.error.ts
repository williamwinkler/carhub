import { HttpStatus } from "@nestjs/common";
import { BaseError } from "../base-error";
import { ErrorCode } from "../error-codes.enum";
import type { ErrorDto } from "../error.dto";

abstract class UnauthorizedBaseError extends BaseError {
  constructor(error: Omit<ErrorDto, "statusCode">) {
    super({
      ...error,
      statusCode: HttpStatus.UNAUTHORIZED, // always 401
    });
  }
}

export class UnauthorizedError extends UnauthorizedBaseError {
  constructor() {
    super({
      errorCode: ErrorCode.UNAUTHORIZED,
      message: "Invalid or missing authentication credentials",
    });
  }
}
