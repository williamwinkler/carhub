import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import pkg from "../../../package.json";
import { GeneralResponseDto } from "../dto/general-response.dto";

@Injectable()
export class ResponseWrapperInterceptor<T>
  implements NestInterceptor<T, GeneralResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<GeneralResponseDto<T>> {
    return next.handle().pipe(
      map((data) => ({
        apiVersion: pkg.version,
        data,
      })),
    );
  }
}
