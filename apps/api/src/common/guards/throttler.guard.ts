import { Injectable } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerRequest } from "@nestjs/throttler";

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: ThrottlerRequest): Promise<string> {
    const request = req as any;

    // Check if user is authenticated and has a user ID
    if (request.user?.userId) {
      return `user:${request.user.userId}`;
    }

    // Fall back to IP-based tracking for unauthenticated users
    return request.ip || request.connection?.remoteAddress || "unknown";
  }
}
