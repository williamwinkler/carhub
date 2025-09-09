import { HttpStatus } from "@nestjs/common";
import { BaseError } from "../base-error";
import { ErrorCode } from "../error-codes.enum";
import { ErrorDto } from "../error.dto";

abstract class InternalServerErrorBaseError extends BaseError {
  constructor(error: Omit<ErrorDto, "statusCode">) {
    super({
      ...error,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
}

export class InternalServerError extends InternalServerErrorBaseError {
  constructor() {
    super({
      errorCode: ErrorCode.UNKNOWN,
      message: "An unexpected error occured. Try again.",
    });
  }
}
