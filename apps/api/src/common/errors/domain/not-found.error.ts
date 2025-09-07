import { HttpStatus } from "@nestjs/common";
import { BaseError } from "../base-error";
import { ErrorCode } from "../error-codes.enum";
import { ErrorDto } from "../error.dto";

abstract class NotFoundBaseError extends BaseError {
  constructor(error: Omit<ErrorDto, "statusCode">) {
    super({
      ...error,
      statusCode: HttpStatus.NOT_FOUND, // always 404
    });
  }
}

export class NotFoundError extends NotFoundBaseError {
  constructor() {
    super({
      errorCode: ErrorCode.NOT_FOUND,
      message: "The item could not be found",
    });
  }
}

export class CarNotFoundError extends NotFoundBaseError {
  constructor() {
    super({
      errorCode: ErrorCode.CAR_NOT_FOUND,
      message: "Car could not be found",
    });
  }
}
