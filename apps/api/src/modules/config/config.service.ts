// config/config.service.ts
import { Injectable } from "@nestjs/common";
import { ConfigService as NestConfigService } from "@nestjs/config";
import { ConfigSchema } from "./config.schema";

@Injectable()
export class ConfigService {
  constructor(private config: NestConfigService<ConfigSchema, true>) {}

  // Overload signatures
  get<K extends keyof ConfigSchema>(key: K): ConfigSchema[K];
  get<K extends keyof ConfigSchema>(
    key: K,
    defaultValue: ConfigSchema[K],
  ): ConfigSchema[K];

  // Implementation
  get<K extends keyof ConfigSchema>(
    key: K,
    defaultValue?: ConfigSchema[K],
  ): ConfigSchema[K] {
    return (
      this.config.get(key, {
        infer: true,
      }) ?? (defaultValue as ConfigSchema[K])
    );
  }

  /**
   * Get throttler configuration for the application
   */
  getThrottlerConfig() {
    return [
      {
        name: "short",
        ttl: this.get("THROTTLE_SHORT_TTL"),
        limit: this.get("THROTTLE_SHORT_LIMIT"),
      },
      {
        name: "medium",
        ttl: this.get("THROTTLE_MEDIUM_TTL"),
        limit: this.get("THROTTLE_MEDIUM_LIMIT"),
      },
      {
        name: "long",
        ttl: this.get("THROTTLE_LONG_TTL"),
        limit: this.get("THROTTLE_LONG_LIMIT"),
      },
    ];
  }

  /**
   * Get CORS configuration for the application
   */
  getCorsConfig() {
    const origins = this.get("CORS_ORIGINS").split(",");

    return {
      origin: origins,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Accept",
        "Accept-Language",
        "Content-Language",
        "x-trpc-source",
        "x-trpc-batch",
        "x-api-key",
      ],
      credentials: this.get("CORS_CREDENTIALS"),
      optionsSuccessStatus: 200,
    };
  }

  /**
   * Get API versioning configuration
   */
  getVersioningConfig() {
    return {
      prefix: this.get("API_VERSION_PREFIX"),
      defaultVersion: this.get("API_DEFAULT_VERSION"),
    };
  }

  /**
   * Get test database configuration
   * Falls back to main database config if test-specific variables are not set
   */
  getTestDatabaseConfig() {
    return {
      type: "postgres" as const,
      host: this.get("TEST_POSTGRES_HOST") || this.get("POSTGRES_HOST"),
      port: this.get("TEST_POSTGRES_PORT") || this.get("POSTGRES_PORT"),
      database: this.get("TEST_POSTGRES_DATABASE") || this.get("POSTGRES_DATABASE"),
      username: this.get("TEST_POSTGRES_USERNAME") || this.get("POSTGRES_USERNAME"),
      password: this.get("TEST_POSTGRES_PASSWORD") || this.get("POSTGRES_PASSWORD"),
      synchronize: true, // Always sync in tests
      dropSchema: false, // Don't drop schema by default (allow override via env)
      logging: process.env.NODE_ENV === "development" ? ["error"] : false,
    };
  }
}
