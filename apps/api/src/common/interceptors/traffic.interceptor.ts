import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Request } from "express";
import { Observable } from "rxjs";
import { finalize } from "rxjs/operators";

@Injectable()
export class TrafficInterceptor implements NestInterceptor {
  private readonly logger = new Logger("API");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const url = request.url;
    const method = request.method;
    const start = Date.now();

    return next.handle().pipe(
      finalize(() => {
        const duration = Date.now() - start;
        this.logger.debug(`${method} ${url} | Duration: ${duration}ms`);
      }),
    );
  }
}
