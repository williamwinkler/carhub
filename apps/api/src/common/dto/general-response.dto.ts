import { ApiProperty } from "@nestjs/swagger";

export class GeneralResponseDto<T> {
  @ApiProperty({ description: "The version of the API" })
  apiVersion: string;

  @ApiProperty({ description: "The data of the response" })
  data: T;
}
