import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { createCarSchema } from "./create-car.dto"; // adjust path

export const carSchema = createCarSchema
  .extend({
    id: z.uuid().describe("The unique id of the car (UUID)"),
    createdBy: z.uuid().describe("The user who created this car"),
    createdAt: z.string().datetime().describe("When the car record was created"),
    updatedBy: z.uuid().optional().describe("The user who last updated this car"),
    updatedAt: z.string().datetime().optional().describe("When the car record was last updated"),
    favoritedBy: z.array(z.uuid()).default([]).describe("List of user IDs who favorited this car"),
  })
  .strict();

export class CarDto extends createZodDto(carSchema) {}
