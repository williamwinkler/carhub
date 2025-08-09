import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { CreateCarSchema } from "./create-car.dto"; // adjust path

export const CarSchema = CreateCarSchema.extend({
  id: z.string().uuid().describe("The unique id of the car (UUID)"),
});

export class CarDto extends createZodDto(CarSchema) {}
