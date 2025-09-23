import { createZodDto } from "nestjs-zod";
import { createCarSchema } from "./create-car.dto";

export const updateCarSchema = createCarSchema.partial().strict();

export class UpdateCarDto extends createZodDto(updateCarSchema) {}
