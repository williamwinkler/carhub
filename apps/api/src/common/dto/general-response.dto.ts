import { ApiProperty } from "@nestjs/swagger";

export class GeneralResponseDto<T> {
  @ApiProperty({ description: "The version of the API", example: "1.0.0" })
  apiVersion: string;

  @ApiProperty({ description: "The data of the response" })
  data: T;
}
