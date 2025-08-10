// not-found-error.decorator.ts
import { ApiExtraModels, ApiResponse, getSchemaPath } from "@nestjs/swagger";
import { NotFoundErrorResponse } from "../errors/not-found.error.dto";

export function NotFound(): MethodDecorator {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiExtraModels(NotFoundErrorResponse)(target, propertyKey, descriptor);
    ApiResponse({
      status: 404,
      description: "Resource not found",
      schema: { $ref: getSchemaPath(NotFoundErrorResponse) },
    })(target, propertyKey, descriptor);
  };
}
