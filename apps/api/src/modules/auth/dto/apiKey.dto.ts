import { createZodDto } from "nestjs-zod";
import z from "zod";

const apiKeySchema = z.object({
  apiKey: z.string().describe("The generated apiKey"),
});

export class ApiKeyDto extends createZodDto(apiKeySchema) {}
