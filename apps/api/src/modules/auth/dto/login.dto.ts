import { createZodDto } from "nestjs-zod";
import z from "zod";

export const loginSchema = z.object({
  username: z.string().min(1).max(80).describe("The username of the user"),
  password: z.string().min(5).max(255).describe("The password of the user"),
});

export class LoginDto extends createZodDto(loginSchema) {}
