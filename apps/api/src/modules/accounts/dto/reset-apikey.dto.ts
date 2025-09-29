import { uuidSchema } from "@api/common/schemas/common.schema";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const ResetApiKeySchema = z.object({
  userId: uuidSchema.describe("The ID of the user"),
});

export class ResetApiKeyDto extends createZodDto(ResetApiKeySchema) {}
