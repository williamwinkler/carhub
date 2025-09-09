import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import pkg from "../../../package.json";
import { GeneralResponseDto } from "../dto/general-response.dto";
import { InternalServerError } from "../errors/domain/internal-server-error";
import { RESPONSE_DTO_KEY, ResponseDtoMeta } from "../utils/swagger.utils";

@Injectable()
export class ResponseValidationInterceptor<T>
  implements NestInterceptor<T, GeneralResponseDto<T>>
{
  private readonly logger = new Logger(ResponseValidationInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<GeneralResponseDto<T>> {
    const handler = context.getHandler();
    const meta: ResponseDtoMeta | undefined =
      this.reflector.get<ResponseDtoMeta>(RESPONSE_DTO_KEY, handler);

    const httpCtx = context.switchToHttp();
    const req: Request = httpCtx.getRequest();

    return next.handle().pipe(
      map((data) => {
        if (meta?.schema) {
          const schemaName = meta.classRef?.name ?? "UnknownDto";
          const path = `${req.method} ${req.url}`;

          try {
            if (meta.isList) {
              const paginated = data as any;
              paginated.items = meta.schema.array().parse(paginated.items);
              data = paginated;
            } else {
              data = meta.schema.parse(data) as T;
            }
          } catch (error: any) {
            this.logger.error(
              `Outgoing response validation failed for schema ${schemaName} at ${path}: ${error}`,
            );
            throw new InternalServerError();
          }
        }

        return {
          apiVersion: pkg.version,
          data,
        };
      }),
    );
  }
}
