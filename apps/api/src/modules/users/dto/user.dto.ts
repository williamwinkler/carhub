import z from "zod";
import { usersFields } from "../users.schema";
import { createZodDto } from "nestjs-zod";

export const userSchema = z.object({
  username: usersFields.username,
  firstName: usersFields.firstName,
  lastName: usersFields.lastName,
}).meta({ id: "UserDto" })

export class UserDto extends createZodDto(userSchema) {}
