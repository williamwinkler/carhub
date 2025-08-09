import { BadRequestException } from '@nestjs/common';
import {
  BadRequestErrorCode,
  BadRequestErrorResponse,
} from './bad-request-error.dto';

export class BadRequestError extends BadRequestException {
  constructor(
    message: string,
    errorCode: BadRequestErrorCode = BadRequestErrorCode.GENERAL_ERROR,
    errors: BadRequestErrorResponse['errors'] = []
  ) {
    super({
      statusCode: 400,
      errorCode,
      message,
      errors,
    } satisfies BadRequestErrorResponse);
  }
}
