import { ApiProperty } from '@nestjs/swagger';

export enum BadRequestErrorCode {
  GENERAL_ERROR = 100,
  VALIDATION_ERROR = 101,
}

export class BadRequestErrorItem {
  @ApiProperty({ example: 'invalid_enum_value' })
  code!: string;

  @ApiProperty({ example: ['brand'] })
  path!: (string | number)[];

  @ApiProperty({
    example: "Invalid enum value. Expected 'BMW' | 'Audi', received 'Tesla'",
  })
  message!: string;

  @ApiProperty({ example: 'Tesla', nullable: true })
  received?: any;

  @ApiProperty({ example: ['BMW', 'Audi'], nullable: true })
  options?: any[];
}

export class BadRequestErrorResponse {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    example: BadRequestErrorCode.GENERAL_ERROR,
    description: 'Custom application error code',
    enum: BadRequestErrorCode,
  })
  errorCode!: number;

  @ApiProperty({ example: 'Validation failed' })
  message!: string;

  @ApiProperty({ type: [BadRequestErrorItem] })
  errors!: BadRequestErrorItem[];
}
