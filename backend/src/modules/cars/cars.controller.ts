import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { UUID } from 'crypto';
import { BadRequest } from 'src/common/decorators/bad-request-error.decorator';
import { NotFound } from 'src/common/decorators/not-found-error.decorator';
import { zParam } from 'src/common/decorators/zod-param.decorator';
import { zQuery } from 'src/common/decorators/zod-query.decorator';
import {
  limitSchema,
  skipSchema,
  uuidSchema,
} from 'src/common/schemas/query-params.schema';
import z from 'zod';
import { CarsService } from './cars.service';
import { CarDto, CarListDto } from './dto/car.dto';
import {
  CarBrandSchema,
  CarModelSchema,
  CreateCarDto,
} from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { CarBrand } from './entities/car.entity';

@Controller({ path: 'cars', version: '1' })
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a car' })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Car created successfully' })
  create(@Body() dto: CreateCarDto) {
    return this.carsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List cars' })
  @ApiOkResponse({ type: CarListDto })
  @BadRequest()
  findAll(
    @zQuery('brand', CarBrandSchema.optional()) brand?: CarBrand,
    @zQuery('model', CarModelSchema.optional()) model?: string,
    @zQuery('skip', skipSchema.optional()) skip = 0,
    @zQuery('limit', limitSchema.optional()) limit = 10,
  ): CarListDto {
    return this.carsService.findAll({ brand, model, skip, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'List cars' })
  @ApiOkResponse({ type: CarDto })
  @BadRequest()
  @NotFound()
  findOne(
    @zParam('id', uuidSchema) id: UUID,
  ) {
    return this.carsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a car' })
  @ApiOkResponse({ type: CarDto, description: 'Car succesfully updated' })
  update(@zParam('id', uuidSchema) id: UUID, @Body() dto: UpdateCarDto) {
    return this.carsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a car' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Car deleted successfully' })
  @BadRequest()
  @NotFound()
  remove(@zParam('id', uuidSchema) id: UUID) {
    this.carsService.remove(id);
  }
}
