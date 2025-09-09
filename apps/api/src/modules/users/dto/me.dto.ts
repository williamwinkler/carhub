import z from "zod";
import { roles } from "../entities/user.entity";
import { createZodDto } from "nestjs-zod";

const meSchema = z.object({
  id: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(roles)
})

export class MeDto extends createZodDto(meSchema) {}
