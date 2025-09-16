import { z } from "zod";
import pkg from "./../../../package.json";

/** All environment variables for the API */
export const configSchema = z.object({
  SERVICE_NAME: z.string().default(pkg.name),
  NODE_ENV: z.enum(["development", "test", "production"]),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  PORT: z.coerce.number().default(3001),

  // CORS Configuration
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://127.0.0.1:3000"),

  // Postgres
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.coerce.number(),
  POSTGRES_DATABASE: z.string(),
  POSTGRES_USERNAME: z.string(),
  POSTGRES_PASSWORD: z.string(),
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
