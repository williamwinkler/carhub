import type { RoleType } from "@api/modules/users/entities/user.entity";
import { Logger } from "@nestjs/common";
import type { UUID } from "crypto";
import { ClsServiceManager } from "nestjs-cls";
import { AppError } from "./errors/app-error";
import { Errors } from "./errors/errors";

export type Principal = {
  id: UUID;
  role: RoleType;
  authType: "jwt" | "api-key";
  sessionId?: UUID;
};

export type CtxStore = {
  requestId: UUID;
  correlationId: UUID;
  principal: Principal | null;
};

export class Ctx {
  private static readonly logger = new Logger(Ctx.name);
  private static cls() {
    return ClsServiceManager.getClsService<CtxStore>();
  }

  // Request ID
  static get requestId(): UUID {
    return this.cls().get("requestId");
  }
  static set requestId(value: UUID) {
    this.cls().set("requestId", value);
  }

  // Correlation ID
  static get correlationId(): UUID {
    return this.cls().get("correlationId");
  }
  static set correlationId(value: UUID) {
    this.cls().set("correlationId", value);
  }

  // Principal (unified user identity)
  static get principal(): Principal | null {
    return this.cls().get("principal");
  }
  static principalRequired(): Principal {
    const principal = this.cls().get("principal");
    if (!principal) {
      this.logger.debug("User unauthorized - no principal");
      throw new AppError(Errors.UNAUTHORIZED);
    }

    return principal;
  }
  static set principal(value: Principal | null) {
    this.cls().set("principal", value);
  }

  // Convenience accessors
  static get userId(): UUID | undefined {
    return this.principal?.id;
  }

  static userIdRequired(): UUID {
    const id = this.userId;
    if (!id) {
      this.logger.debug("User unauthorized - no userId");
      throw new AppError(Errors.UNAUTHORIZED);
    }

    return id;
  }

  static get role(): RoleType | undefined {
    return this.principal?.role;
  }

  static roleRequired(): RoleType {
    const role = this.principal?.role;
    if (!role) {
      this.logger.debug("User unauthorized - no role");
      throw new AppError(Errors.UNAUTHORIZED);
    }

    return role;
  }

  static get sessionId(): UUID | undefined {
    return this.principal?.sessionId;
  }

  static get authType(): "jwt" | "api-key" | undefined {
    return this.principal?.authType;
  }
}
