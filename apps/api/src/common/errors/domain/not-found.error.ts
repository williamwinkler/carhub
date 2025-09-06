import { HttpStatus } from "@nestjs/common";
import type { BaseErrorOptions } from "../base-error";
import { BaseError } from "../base-error";
import { ErrorCode } from "../error-codes.enum";

interface NotFoundErrorOptions extends Omit<BaseErrorOptions, "status"> {}

export abstract class NotFoundBaseError extends BaseError {
  constructor(options: NotFoundErrorOptions) {
    super({
      ...options,
      status: HttpStatus.NOT_FOUND, // always 404
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
  constructor(carId?: string) {
    super({
      errorCode: ErrorCode.CAR_NOT_FOUND,
      message: "Car could not be found",
      details: carId ? { carId } : undefined,
    });
  }
}
