import { createZodDto } from "nestjs-zod";
import z from "zod";

const jwtSchema = z.object({
  accessToken: z.jwt(),
  refreshToken: z.string(),
});

export class JwtDto extends createZodDto(jwtSchema) {}
