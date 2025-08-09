import { createZodDto } from "nestjs-zod";
import { CreateCarSchema } from "./create-car.dto";

export const UpdateCarSchema = CreateCarSchema.partial();
export class UpdateCarDto extends createZodDto(UpdateCarSchema) {}
