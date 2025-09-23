import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import z, { ZodError } from "zod";
import { AppError } from "../errors/app-error";
import { ErrorDto, ErrorSchema } from "../errors/error.dto";

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let errorResponse: ErrorDto = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "An unexpected error has occurred, please try again",
      errorCode: "UNEXPECTED_ERROR",
    };

    if (exception instanceof AppError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const appErrorResponse = exception.getResponse() as any;
      errorResponse = {
        statusCode: appErrorResponse.statusCode,
        errorCode: appErrorResponse.errorCode,
        message: appErrorResponse.message,
        errors: appErrorResponse.errors,
      };
    } else if (exception instanceof HttpException) {
      // Wrap Nest built-in HttpExceptions
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === "string"
          ? res
          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((res as any).message ?? "Unexpected error");

      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        errorResponse.statusCode = HttpStatus.TOO_MANY_REQUESTS;
        errorResponse.errorCode = "TOO_MANY_REQUESTS";
        errorResponse.message = "Too many requests, try again later.";
      } else {
        errorResponse.statusCode = status;
        errorResponse.message = message;

        if (status === HttpStatus.BAD_REQUEST) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const zodError: ZodError = (exception as any).error;

          if (zodError) {
            errorResponse.errorCode = "VALIDATION_ERROR";
            errorResponse.errors = zodError.issues.map((issue) => ({
              field: issue.path.join("."), // e.g. "password" or "user.email"
              message: issue.message, // clean message
              code: issue.code, // optional: Zod error code like "too_small"
            }));
          }
        }
      }
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
