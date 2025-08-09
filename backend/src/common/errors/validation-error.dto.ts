// src/common/errors/validation-error.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ValidationErrorItem {
  @ApiProperty({ description: 'The value that was received', example: 'Tesla', nullable: true })
  received?: any;

  @ApiProperty({ description: 'The Zod error code' })
  code!: string;

  @ApiProperty({
    description: 'Allowed options (for enums)',
    required: false,
  })
  options?: any[];

  @ApiProperty({
    description: 'The path to the invalid property',
    type: [String],
  })
  path!: (string | number)[];

  @ApiProperty({
    description: 'The human-readable error message',
  })
  message!: string;
}

export class ValidationErrorResponse {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'Validation failed' })
  message!: string;

  @ApiProperty({ type: [ValidationErrorItem] })
  errors!: ValidationErrorItem[];
}
