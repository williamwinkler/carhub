import type { UUID } from "crypto";
import { ClsServiceManager } from "nestjs-cls";

export type CtxStore = {
  requestId: UUID;
  correlationId: UUID;
  userId?: string;
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

  // UserId
  static get userId(): string | undefined {
    return this.cls().get("userId");
  }
  static set userId(value: string) {
    this.cls().set("userId", value);
  }
}
