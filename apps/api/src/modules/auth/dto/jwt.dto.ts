import { createZodDto } from "nestjs-zod";
import z from "zod";

export const jwtSchema = z.object({
  accessToken: z.jwt(),
});

export class JwtDto extends createZodDto(jwtSchema) {}
