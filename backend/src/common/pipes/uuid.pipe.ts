// src/common/pipes/uuid.pipe.ts
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { z } from 'zod';

@Injectable()
export class UuidPipe implements PipeTransform {
  private readonly schema = z.string().uuid();

  transform(value: any) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException('Invalid UUID format');
    }
    return result.data;
  }
}
