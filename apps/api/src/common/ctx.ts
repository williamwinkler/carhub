import type { Role } from "@api/modules/users/entities/user.entity";
import type { UUID } from "crypto";
import { ClsServiceManager } from "nestjs-cls";
import { UnauthorizedError } from "./errors/domain/unauthorized.error";

export type Principal = {
  id: UUID;
  role: Role;
  authType: "jwt" | "api-key";
  sessionId?: UUID;
};

export type CtxStore = {
  requestId: UUID;
  correlationId: UUID;
  principal: Principal | null;
};

export class Ctx {
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
      throw new UnauthorizedError();
    }

    return id;
  }

  static get role(): Role | undefined {
    return this.principal?.role;
  }

  static roleRequired(): Role {
    const role = this.principal?.role;
    if (!role) {
      throw new UnauthorizedError();
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
