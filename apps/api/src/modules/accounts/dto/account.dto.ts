import { registerSchema } from "@api/modules/auth/dto/register.dto";
import { createZodDto } from "nestjs-zod";
import z from "zod";

export const accountSchema = registerSchema
  .omit({ password: true })
  .extend({
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
