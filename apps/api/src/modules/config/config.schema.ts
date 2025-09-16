import { z } from "zod";
import pkg from "./../../../package.json";

/** All environment variables for the API */
export const configSchema = z.object({
  SERVICE_NAME: z.string().default(pkg.name),
  NODE_ENV: z.enum(["development", "test", "production"]),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  PORT: z.coerce.number().default(3001),

  // Rate Limiting
  THROTTLE_SHORT_TTL: z.coerce.number().default(1000), // 1 second
  THROTTLE_SHORT_LIMIT: z.coerce.number().default(3), // 3 requests per second
  THROTTLE_MEDIUM_TTL: z.coerce.number().default(10000), // 10 seconds
  THROTTLE_MEDIUM_LIMIT: z.coerce.number().default(20), // 20 requests per 10 seconds
  THROTTLE_LONG_TTL: z.coerce.number().default(60000), // 1 minute
  THROTTLE_LONG_LIMIT: z.coerce.number().default(100), // 100 requests per minute

  // CORS Configuration
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://127.0.0.1:3000"),
  CORS_CREDENTIALS: z.coerce.boolean().default(true),

  // API Versioning
  API_VERSION_PREFIX: z.string().default("v"),
  API_DEFAULT_VERSION: z.string().default("1"),

  // Postgres
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.coerce.number(),
  POSTGRES_DATABASE: z.string(),
  POSTGRES_USERNAME: z.string(),
  POSTGRES_PASSWORD: z.string(),

  // Test Database Configuration (defaults to main DB if not specified)
  TEST_POSTGRES_HOST: z.string().optional(),
  TEST_POSTGRES_PORT: z.coerce.number().optional(),
  TEST_POSTGRES_DATABASE: z.string().optional(),
  TEST_POSTGRES_USERNAME: z.string().optional(),
  TEST_POSTGRES_PASSWORD: z.string().optional(),
});

export type ConfigSchema = z.infer<typeof configSchema>;

export function validateEnv(env: Record<string, unknown>) {
  const parsed = configSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(
      "❌ Invalid environment variables: " +
        JSON.stringify(z.treeifyError(parsed.error), null, 2),
    );
  }

  return parsed.data;
}
