import { ApiProperty } from "@nestjs/swagger";

class MetaPaginationDto {
  @ApiProperty({
    description: "The total number of items available across all pages",
  })
  total: number;

  @ApiProperty({
    description: "The limit of items",
  })
  limit: number;

  @ApiProperty({
    description: "Items skipped",
  })
  skipped: number;

  @ApiProperty({
    description: "The count of items",
  })
  count: number;
}

export class PaginationDto<T> {
  @ApiProperty({
    description: "Metadata for pagination",
    type: MetaPaginationDto,
  })
  meta: MetaPaginationDto;

  items: T[];
}
