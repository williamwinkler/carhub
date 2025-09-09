import { TokenPayload } from "@api/modules/auth/auth.service";
import { Role } from "@api/modules/users/entities/user.entity";
import type { UUID } from "crypto";
import { ClsServiceManager } from "nestjs-cls";

export type CtxStore = {
  requestId: UUID;
  correlationId: UUID;
  token: TokenPayload | null;
};

export class Ctx {
  private static cls() {
    return ClsServiceManager.getClsService<CtxStore>();
  }

  // RequestId
  static get requestId(): UUID {
    return this.cls().get("requestId");
  }
  static set requestId(value: UUID) {
    this.cls().set("requestId", value);
  }

  // CorrelationId
  static get correlationId(): UUID {
    return this.cls().get("correlationId");
  }
  static set correlationId(value: UUID) {
    this.cls().set("correlationId", value);
  }

  static get token(): TokenPayload | null {
    return this.cls().get("token");
  }
  static set token(value: TokenPayload | null) {
    this.cls().set("token", value);
  }

  static get userId(): string | undefined {
    return this.cls().get("token")?.sub;
  }

  static get role(): Role | undefined {
    return this.cls().get("token")?.role;
  }
}
