import { ApiExtraModels, ApiResponse, getSchemaPath } from "@nestjs/swagger";
import { BadRequestErrorResponse } from "../errors/bad-request-error.dto";

export function BadRequest(): MethodDecorator {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiExtraModels(BadRequestErrorResponse)(target, propertyKey, descriptor);
    ApiResponse({
      status: 400,
      description: "Bad request error",
      schema: { $ref: getSchemaPath(BadRequestErrorResponse) },
    })(target, propertyKey, descriptor);
  };
}
