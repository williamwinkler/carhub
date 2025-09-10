import { createZodDto } from "nestjs-zod";
import z from "zod";

export const refreshTokenSchema = z.object({
  refreshToken: z.jwt(),
});

export class RefreshTokenDto extends createZodDto(refreshTokenSchema) {}
