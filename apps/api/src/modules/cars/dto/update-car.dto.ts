import { createZodDto } from "nestjs-zod";
import { createCarSchema } from "./create-car.dto";

export const updateCarSchema = createCarSchema.partial();
export class UpdateCarDto extends createZodDto(updateCarSchema) {}
