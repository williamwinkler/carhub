import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { BaseError } from "../errors/base-error";
import { ErrorCode } from "../errors/error-codes.enum";
import { ErrorDto, ErrorDtoSchema } from "../errors/error.dto";

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let errorResponse: ErrorDto;

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

      errorResponse = {
        statusCode: status,
        errorCode: ErrorCode.GENERAL_ERROR,
        message,
      };
    } else {
      this.logger.error(
        `HTTP 500 | ${request.method} ${request.url} | ${(exception as Error)?.message}`,
        (exception as Error)?.stack,
      );

      errorResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: ErrorCode.GENERAL_ERROR,
        message: "Internal server error",
      };
    }

    // Validate against Zod schema before sending
    const parsed = ErrorDtoSchema.safeParse(errorResponse);
    if (!parsed.success) {
      this.logger.error("Invalid ErrorDto shape", parsed.error.format());
      response.status(500).json({
        statusCode: 500,
        errorCode: ErrorCode.GENERAL_ERROR,
        message: "Internal server error",
      });
      return;
    }

    response.status(parsed.data.statusCode).json(parsed.data);
  }
}
