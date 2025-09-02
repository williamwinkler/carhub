import { z } from "zod";

/** All environment variables for the API */
export const configSchema = z.object({
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  PORT: z.coerce.number().default(3000),
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
