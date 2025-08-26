import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import pkg from "../../../package.json";
import { GeneralResponseDto } from "../dto/general-response.dto";

@Injectable()
export class WrapResponseInterceptor<T>
  implements NestInterceptor<T, GeneralResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<GeneralResponseDto<T>> {
    return next.handle().pipe(map((data) => wrapResponse(data)));
  }
}

/** Wraps the data in the general API response DTO */
export function wrapResponse<T>(data: T): GeneralResponseDto<T> {
  return {
    apiVersion: pkg.version,
    data,
  };
}
