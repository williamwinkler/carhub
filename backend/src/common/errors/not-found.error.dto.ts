import { NotFoundException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

type Type = 'Car' | 'Something else';

export class NotFoundErrorResponse {
  @ApiProperty({ example: 'Car', required: false })
  type?: Type;

  @ApiProperty({ example: 'Car could not be found' })
  message!: string;
}

export class NotFoundError extends NotFoundException {
  constructor(type?: Type) {
    super({
      type,
      message: type ? `${type} could not be found` : 'Resource could not be found',
    } satisfies NotFoundErrorResponse);
  }
}
