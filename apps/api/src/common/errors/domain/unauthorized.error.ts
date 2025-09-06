import { HttpStatus } from "@nestjs/common";
import { BaseError, BaseErrorOptions } from "../base-error";
import { ErrorCode } from "../error-codes.enum";

interface NotFoundErrorOptions extends Omit<BaseErrorOptions, "status"> {}

export abstract class UnauthorizedBaseError extends BaseError {
  constructor(options: NotFoundErrorOptions) {
    super({
      ...options,
      status: HttpStatus.UNAUTHORIZED, // always 401
    });
  }
}

export class UnauthorizedError extends UnauthorizedBaseError {
  constructor() {
    super({
      errorCode: ErrorCode.UNAUTHORIZED,
      message: "You must be logged in to perform the action",
    });
  }
}
