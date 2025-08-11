import type { UUID } from "crypto";
import { ClsServiceManager } from "nestjs-cls";

export type CtxStore = {
  requestId: UUID;
  userId?: string;
};

export class Ctx {
  private static cls() {
    return ClsServiceManager.getClsService<CtxStore>();
  }

  static get requestId(): string {
    return this.cls().get("requestId");
  }
  static set requestId(value: UUID) {
    this.cls().set("requestId", value);
  }

  static get userId(): string | undefined {
    return this.cls().get("userId");
  }
  static set userId(value: string) {
    this.cls().set("userId", value);
  }
}
