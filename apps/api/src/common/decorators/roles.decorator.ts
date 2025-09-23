import type { RoleType } from "@api/modules/users/entities/user.entity";
import { applyDecorators, SetMetadata, HttpStatus } from "@nestjs/common";
import { ApiErrorResponse } from "./swagger-responses.decorator";
import { Errors } from "../errors/errors";

export const ROLES_KEY = "roles";
export function Roles(...roles: RoleType[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    ApiErrorResponse(Errors.FORBIDDEN)
  );
}
