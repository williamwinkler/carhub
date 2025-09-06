import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { Ctx } from "../ctx";

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === "string"
          ? res
          : (res as HttpException).message || message;
    }

    let errorId: string | undefined;

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      errorId = randomUUID();
      this.logger.error(
        `HTTP ${status} | ${request.method} ${request.url} | errorId=${errorId} | ${message}`,
        (exception as Error)?.stack,
      );
    } else {
      this.logger.debug(
        `HTTP ${status} | ${request.method} ${request.url} | ${message}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      message,
      requestId: Ctx.requestId,
      ...(errorId ? { errorId } : {}),
      timestamp: new Date().toISOString(),
    });
  }
}
