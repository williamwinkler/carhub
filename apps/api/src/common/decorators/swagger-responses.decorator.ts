import { applyDecorators, HttpStatus } from "@nestjs/common";
import { ApiExtraModels, ApiResponse, getSchemaPath } from "@nestjs/swagger";
import { ErrorDto } from "../errors/error.dto";

export function BadRequestDecorator() {
  return applyDecorators(
    ApiExtraModels(ErrorDto),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: "Bad request",
      schema: { $ref: getSchemaPath(ErrorDto) },
    }),
  );
}

export function ForbiddenDecorator() {
  return applyDecorators(
    ApiExtraModels(ErrorDto),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: "Forbidden",
      schema: { $ref: getSchemaPath(ErrorDto) },
    }),
  );
}

export function UnauthorizedDecorator() {
  return applyDecorators(
    ApiExtraModels(ErrorDto),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: "Unauthorized",
      schema: { $ref: getSchemaPath(ErrorDto) },
    }),
  );
}

export function NotFoundDecorator() {
  return applyDecorators(
    ApiExtraModels(ErrorDto),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: "Not Found",
      schema: { $ref: getSchemaPath(ErrorDto) },
    }),
  );
}

export function ConflictDecorator() {
  return applyDecorators(
    ApiExtraModels(ErrorDto),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: "Conflict",
      schema: { $ref: getSchemaPath(ErrorDto) },
    }),
  );
}
