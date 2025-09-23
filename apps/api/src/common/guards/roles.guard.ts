import { RoleType } from "@api/modules/users/entities/user.entity";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Ctx } from "../ctx";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { AppError } from "../errors/app-error";
import { Errors } from "../errors/errors";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) {
      return true;
    }

    const role = Ctx.roleRequired();
    if (role !== "admin" && !requiredRoles.includes(role)) {
      throw new AppError(Errors.UNAUTHORIZED);
    }

    return true;
  }
}
