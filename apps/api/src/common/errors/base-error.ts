import { HttpException } from "@nestjs/common";
import type { ErrorDto } from "./error.dto";

export abstract class BaseError extends HttpException {
  readonly error: ErrorDto;

  constructor(error: ErrorDto) {
    super(error, error.statusCode);
    this.error = error;
  }
}
