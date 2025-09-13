import { Injectable } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerRequest } from "@nestjs/throttler";
import { Request } from "express";
import { Ctx } from "../ctx";

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: ThrottlerRequest): Promise<string> {
    // Check if user is authenticated and has a user ID
    const userId = Ctx.userId;
    if (userId) {
      return `user:${userId}`;
    }

    // Fall back to IP-based tracking for unauthenticated users
    const request = req as unknown as Request;

    return request.ip ?? request.socket?.remoteAddress ?? "unknown";
  }
}
