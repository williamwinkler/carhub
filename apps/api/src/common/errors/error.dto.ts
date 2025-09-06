import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { ErrorCode } from "./error-codes.enum";

export class ErrorItemDto {
  @ApiProperty({ required: true })
  code: string;

  @ApiProperty({ required: true })
  path: (string | number)[];

  @ApiProperty({ required: true })
  message: string;

  @ApiProperty({ nullable: true })
  received?: unknown;

  @ApiProperty({ nullable: true })
  options?: unknown[];
}

export class ErrorResponseDto {
  @ApiProperty({
    required: true,
    enum: HttpStatus,
    description: "HTTP status code",
  })
  statusCode: number;

  @ApiProperty({
    description: "Application-specific error code",
    enum: ErrorCode,
  })
  errorCode: ErrorCode;

  @ApiProperty({ description: "Message for the error" })
  message: string;

  @ApiProperty({ type: [ErrorItemDto], required: false })
  errors?: ErrorItemDto[];
}
