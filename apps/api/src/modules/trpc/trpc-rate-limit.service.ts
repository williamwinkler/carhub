import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import type { Cache } from "cache-manager";

export type RateLimitRecord = {
  count: number;
  resetTime: number;
  firstHit: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
};

@Injectable()
export class TrpcRateLimitService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async checkRateLimit(
    key: string,
    windowMs: number,
    max: number,
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const cacheKey = `rate-limit:${key}:${windowStart}`;

    try {
      // Get current record from cache
      let record = await this.cacheManager.get<RateLimitRecord>(cacheKey);

      if (!record || now > record.resetTime) {
        // Create new record for this window
        record = {
          count: 0,
          resetTime: windowStart + windowMs,
          firstHit: now,
        };
      }

      // Check if limit exceeded
      if (record.count >= max) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);

        return {
          allowed: false,
          limit: max,
          remaining: 0,
          resetTime: record.resetTime,
          retryAfter,
        };
      }

      // Increment count
      record.count++;

      // Store updated record in cache with TTL slightly longer than window
      const ttlMs = Math.max(record.resetTime - now + 1000, 1000); // Add 1 second buffer
      await this.cacheManager.set(cacheKey, record, ttlMs);

      return {
        allowed: true,
        limit: max,
        remaining: Math.max(0, max - record.count),
        resetTime: record.resetTime,
      };
    } catch (error) {
      // If cache fails, allow the request (fail open)
      console.error("Rate limit cache error:", error);

      return {
        allowed: true,
        limit: max,
        remaining: max - 1,
        resetTime: windowStart + windowMs,
      };
    }
  }
}
