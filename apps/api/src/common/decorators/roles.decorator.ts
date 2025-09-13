import type { Role } from "@api/modules/users/entities/user.entity";
import { applyDecorators, SetMetadata } from "@nestjs/common";
import { Forbidden } from "./swagger-responses.decorator";

export const ROLES_KEY = "roles";
export function Roles(...roles: Role[]) {
  return applyDecorators(SetMetadata(ROLES_KEY, roles), Forbidden());
}
