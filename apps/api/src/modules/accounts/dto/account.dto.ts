import { registerSchema } from "@api/modules/auth/dto/register.dto";
import { Role } from "@api/modules/users/entities/user.entity";
import { createZodDto } from "nestjs-zod";
import z from "zod";

export const accountSchema = registerSchema
  .omit({ password: true })
  .extend({
    id: z.uuid().describe("The unique identifier of the account"),
    role: z.enum(Role).describe("The role of the user (admin or user)"),
    hasApiKey: z
      .boolean()
      .describe("Indicates whether or not the user has generated an API key"),
    createdAt: z.iso.datetime().describe("The create date of the account"),
    updatedAt: z.iso
      .datetime()
      .describe("The last time the account was updated"),
  })
  .strict();

export class AccountDto extends createZodDto(accountSchema) {}
