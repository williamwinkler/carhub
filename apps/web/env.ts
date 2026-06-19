import { z } from "zod";

export const webEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:3001"),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export function validateWebEnv(env: Record<string, unknown>): WebEnv {
  const parsed = webEnvSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(
      "❌ Invalid web environment variables: " +
        JSON.stringify(z.treeifyError(parsed.error), null, 2),
    );
  }

  return parsed.data;
}
