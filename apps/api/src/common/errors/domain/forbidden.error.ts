import { HttpStatus } from "@nestjs/common";
import { BaseError } from "../base-error";
import { ErrorCode } from "../error-codes.enum";
import type { ErrorDto } from "../error.dto";

abstract class ForbiddenBaseError extends BaseError {
  constructor(error: Omit<ErrorDto, "statusCode">) {
    super({
      ...error,
      statusCode: HttpStatus.FORBIDDEN, // always 403
    });
  }
}

export class ForbiddenError extends ForbiddenBaseError {
  constructor(message?: string) {
    super({
      errorCode: ErrorCode.FORBIDDEN,
      message: message ?? "Forbidden",
    });
  }
}

export class OnlyAdminsCanUpdateRolesError extends ForbiddenBaseError {
  constructor() {
    super({
      errorCode: ErrorCode.ONLY_ADMINS_CAN_UPDATE_ROLES,
      message: "Only admins can update the roles of users",
    });
  }
}

export class UsersCanOnlyUpdateOwnCarsError extends ForbiddenBaseError {
  constructor() {
    super({
      errorCode: ErrorCode.USERS_CAN_ONLY_UPDATE_OWN_CARS,
      message: "You can only update your own cars",
    });
  }
}
