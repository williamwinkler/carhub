import { HttpStatus } from "@nestjs/common";
import { ZodError } from "zod";
import { BaseError } from "../base-error";
import { ErrorCode } from "../error-codes.enum";
import { ErrorDto } from "../error.dto";

abstract class BadRequestBaseError extends BaseError {
  constructor(error: Omit<ErrorDto, "statusCode">) {
    super({
      ...error,
      statusCode: HttpStatus.BAD_REQUEST, // always 400
    });
  }
}

export class BadRequestError extends BadRequestBaseError {
  constructor(message?: string) {
    super({
      errorCode: ErrorCode.GENERAL_ERROR,
      message: message ?? "Bad request",
    });
  }
}

export class ValidationError extends BadRequestBaseError {
  constructor(zodError: ZodError) {
    super({
      errorCode: ErrorCode.VALIDATION_ERROR,
      message: zodError.message,
      errors: zodError.issues,
    });
  }
}

export class InvalidCredentialsError extends BadRequestBaseError {
  constructor() {
    super({
      errorCode: ErrorCode.INVALID_CREDENTIALS,
      message: "The combination of the username and password was invalid",
    });
  }
}

export class InvalidRefreshTokenError extends BadRequestBaseError {
  constructor() {
    super({
      errorCode: ErrorCode.INVALID_REFRESH_TOKEN,
      message: "The refresh token is invalid or outdated",
    });
  }
}
