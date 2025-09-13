import type { RoleType } from "@api/modules/users/entities/user.entity";
import { applyDecorators, SetMetadata } from "@nestjs/common";
import { ForbiddenDecorator } from "./swagger-responses.decorator";

export const ROLES_KEY = "roles";
export function Roles(...roles: RoleType[]) {
  return applyDecorators(SetMetadata(ROLES_KEY, roles), ForbiddenDecorator());
}
