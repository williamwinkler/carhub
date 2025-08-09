import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CarBrand } from '../entities/car.entity';

export const CarBrandSchema = z
  .nativeEnum(CarBrand)
  .describe('The brand of the car.');
export const CarModelSchema = z
  .string()
  .min(1, 'Model name is required')
  .max(100, 'Model name must be at most 255 characters long')
  .describe('The model of the car.');

export const CreateCarSchema = z.object({
  brand: CarBrandSchema,
  model: CarModelSchema,
  year: z
    .number()
    .int()
    .gte(1886, { message: 'Cars were not mass-produced before 1886' })
    .lte(new Date().getFullYear() + 1),
  color: z.string().min(1),
  kmDriven: z.number().int().gte(0),
  price: z.number().min(0),
});

export class CreateCarDto extends createZodDto(CreateCarSchema) {}
