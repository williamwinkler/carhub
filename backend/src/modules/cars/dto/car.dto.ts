import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { z } from 'zod';
import { CreateCarSchema } from './create-car.dto'; // adjust path

export const CarSchema = CreateCarSchema.extend({
  id: z.string().uuid(),
});

export class CarDto extends createZodDto(CarSchema) {}

export class CarListDto extends PaginationDto {
  @ApiProperty({
    isArray: true,
    type: CarDto,
    description: 'The list of cars',
  })
  items: CarDto[];
}
