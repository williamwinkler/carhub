import z from "zod";
import { usersFields } from "../users.schema";
import { createZodDto } from "nestjs-zod";

export const userSchema = z.object({
  id: usersFields.id,
  firstName: usersFields.firstName,
  lastName: usersFields.lastName,
});

export class UserDto extends createZodDto(userSchema) {}
