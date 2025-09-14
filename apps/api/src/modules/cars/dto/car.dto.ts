import { uuidSchema } from "@api/common/schemas/common.schema";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { createCarSchema } from "./create-car.dto";

export const carIdSchema = uuidSchema.describe(
  "The unique id of the car (UUID)",
);

export const carSchema = createCarSchema
  .extend({
    id: carIdSchema,
    createdBy: z.uuid().describe("The user who created this car"),
    createdAt: z.iso.datetime().describe("When the car record was created"),
    updatedBy: z.uuid().describe("The user who last updated this car"),
    updatedAt: z.iso
      .datetime()
      .describe("When the car record was last updated"),
    favoritedBy: z
      .array(z.uuid())
      .default([])
      .describe("List of user IDs who favorited this car"),
  })
  .strict();

export class CarDto extends createZodDto(carSchema) {}
