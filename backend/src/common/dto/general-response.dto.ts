import { ApiProperty } from "@nestjs/swagger";
import { PaginationDto } from "./pagination.dto";

export class GeneralResponseDto<T> {
  @ApiProperty({ description: "The version of the API" })
  apiVersion: string;

  @ApiProperty({ description: "The data from the API" })
  data: T;
}
