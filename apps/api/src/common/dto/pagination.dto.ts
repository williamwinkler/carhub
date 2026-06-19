import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";

export const paginationMetaSchema = z
  .object({
    totalItems: z.number().int().min(0),
    limit: z.number().int().min(0),
    skipped: z.number().int().min(0),
    count: z.number().int().min(0),
  })
  .strict();

export const createPaginationSchema = <T extends z.ZodType>(itemSchema: T) =>
  z
    .object({
      items: z.array(itemSchema),
      meta: paginationMetaSchema,
    })
    .strict();

class MetaPaginationDto {
  @ApiProperty({
    description: "The total number of items available across all pages",
  })
  totalItems!: number;

  @ApiProperty({
    description: "The limit of items",
  })
  limit!: number;

  @ApiProperty({
    description: "Items skipped",
  })
  skipped!: number;

  @ApiProperty({
    description: "The count of items",
  })
  count!: number;
}

export class PaginationDto<T> {
  @ApiProperty({
    description: "List of items",
    isArray: true,
  })
  items!: T[];

  @ApiProperty({
    description: "Metadata for pagination",
    type: MetaPaginationDto,
  })
  meta!: MetaPaginationDto;
}
