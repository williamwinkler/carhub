import { HttpStatus } from "@nestjs/common";
import { BaseError } from "../base-error";
import { ErrorCode } from "../error-codes.enum";
import { ErrorDto } from "../error.dto";

abstract class ConflictBaseError extends BaseError {
  constructor(error: Omit<ErrorDto, "statusCode">) {
    super({
      ...error,
      statusCode: HttpStatus.CONFLICT,
    });
  }
}

export class ConflictError extends ConflictBaseError {
  constructor() {
    super({
      errorCode: ErrorCode.CONFLICT,
      message: "Can't perform action due to a conflict",
    });
  }
}
