import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { createCarSchema } from "./create-car.dto"; // adjust path

export const carSchema = createCarSchema.extend({
  id: z.string().uuid().describe("The unique id of the car (UUID)"),
});

export class CarDto extends createZodDto(carSchema) {}
