import { applyDecorators } from "@nestjs/common";
import { ApiSecurity } from "@nestjs/swagger";
import { Errors } from "../errors/errors";
import { SwaggerError } from "./swagger-responses.decorator";

export function ApiKeyAuth() {
  return applyDecorators(
    ApiSecurity("apiKey"),
    SwaggerError(Errors.UNAUTHORIZED),
  );
}
