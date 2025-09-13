// src/modules/trpc/trpc-rate-limit.service.ts
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
      let record: RateLimitRecord | undefined =
        await this.cacheManager.get(cacheKey);

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
      console.warn("Rate limit cache error:", error);

      return {
        allowed: true,
        limit: max,
        remaining: max - 1,
        resetTime: windowStart + windowMs,
      };
    }
  }

  async incrementCounter(
    key: string,
    windowMs: number,
    max: number,
  ): Promise<void> {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const cacheKey = `rate-limit:${key}:${windowStart}`;

    try {
      let record: RateLimitRecord | undefined =
        await this.cacheManager.get(cacheKey);

      if (!record || now > record.resetTime) {
        record = {
          count: 1,
          resetTime: windowStart + windowMs,
          firstHit: now,
        };
      } else {
        record.count++;
      }

      const ttlMs = Math.max(record.resetTime - now + 1000, 1000);
      await this.cacheManager.set(cacheKey, record, ttlMs);
    } catch (error) {
      console.warn("Rate limit increment error:", error);
      // Silently fail - don't throw to avoid breaking the request
    }
  }

  async getRateLimitStatus(
    key: string,
    windowMs: number,
    max: number,
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const cacheKey = `rate-limit:${key}:${windowStart}`;

    try {
      const record: RateLimitRecord | undefined =
        await this.cacheManager.get(cacheKey);

      if (!record || now > record.resetTime) {
        return {
          allowed: true,
          limit: max,
          remaining: max,
          resetTime: windowStart + windowMs,
        };
      }

      return {
        allowed: record.count < max,
        limit: max,
        remaining: Math.max(0, max - record.count),
        resetTime: record.resetTime,
        retryAfter:
          record.count >= max
            ? Math.ceil((record.resetTime - now) / 1000)
            : undefined,
      };
    } catch (error) {
      console.warn("Rate limit status error:", error);

      return {
        allowed: true,
        limit: max,
        remaining: max,
        resetTime: windowStart + windowMs,
      };
    }
  }

  async clearRateLimit(key: string): Promise<void> {
    await this.cacheManager.del(`rate-limit:${key}`);
  }
}
