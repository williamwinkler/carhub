import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import z from "zod";
import { BaseError } from "../errors/base-error";
import { ErrorCode } from "../errors/error-codes.enum";
import { ErrorDto, ErrorSchema } from "../errors/error.dto";

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let errorResponse: ErrorDto = {
      message: "An unexpected error has occurred, please try again",
      errorCode: ErrorCode.UNKNOWN,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    };

    if (exception instanceof BaseError) {
      errorResponse = exception.error;
    } else if (exception instanceof HttpException) {
      // Wrap Nest built-in HttpExceptions
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === "string"
          ? res
          : ((res as any).message ?? "Unexpected error");

      errorResponse.statusCode = status;
      errorResponse.message = message;
    } else {
      this.logger.error(
        `HTTP 500 | ${request.method} ${request.url} | ${(exception as Error)?.message}`,
        (exception as Error)?.stack,
      );
    }

    // Validate against Zod schema before sending
    const parsed = ErrorSchema.safeParse(errorResponse);
    if (!parsed.success) {
      this.logger.error("Invalid ErrorDto shape", z.treeifyError(parsed.error));
      response.status(500).json(errorResponse);
      return;
    }

    response.status(parsed.data.statusCode).json(parsed.data);
  }
}
