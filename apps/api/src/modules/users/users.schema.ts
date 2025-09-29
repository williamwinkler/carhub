import { uuidSchema } from "@api/common/schemas/common.schema";
import z from "zod";

export const usersFields = {
  id: uuidSchema.describe("The ID of the user"),
  firstName: z.string().describe("First name of the user"),
  lastName: z.string().describe("Last name of the user"),
  username: z.string().describe("The username of the user"),
  createdAt: z.iso.date().describe("When the user was created"),
} as const;
