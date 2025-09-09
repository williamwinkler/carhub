import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Observable } from "rxjs";
import { catchError, finalize } from "rxjs/operators";

@Injectable()
export class TrafficInterceptor implements NestInterceptor {
  private readonly logger = new Logger("API");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const url = request.url;
    const method = request.method;
    const start = Date.now();

    let statusCode: number | undefined;

    return next.handle().pipe(
      catchError((err) => {
        if (err instanceof HttpException) {
          statusCode = err.getStatus();
        } else {
          statusCode = 500; // fallback for unexpected errors
        }

        throw err;
      }),
      finalize(() => {
        const duration = Date.now() - start;
        this.logger.debug(
          `${method} ${url} | Status: ${
            statusCode ?? res.statusCode
          } | Duration: ${duration}ms`,
        );
      }),
    );
  }
}
