import { Public } from "@api/common/decorators/public.decorator";
import { Roles } from "@api/common/decorators/roles.decorator";
import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import { SwaggerInfo } from "@api/common/utils/swagger.utils";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { CarManufacturersAdapter } from "./car-manufacturers.adapter";
import { CarManufacturersService } from "./car-manufacturers.service";
import { CarManufacturerDto } from "./dto/car-manufacturer.dto";
import type {
  CarManufacturerIdParamDto,
  FindCarManufacturersQueryDto,
} from "./dto/car-manufacturer-query.dto";
import type { CreateCarManufacturerDto } from "./dto/create-car-manufacturer.dto";
import type { UpdateCarManufacturerDto } from "./dto/update-car-manufacturer.dto";

@Controller("car-manufacturers")
export class CarManufacturersController {
  constructor(
    @Inject(CarManufacturersService)
    private readonly manufacturersService: CarManufacturersService,
    @Inject(CarManufacturersAdapter)
    private readonly manufacturersAdapter: CarManufacturersAdapter,
  ) {}

  @Post()
  @Roles("admin")
  @SwaggerInfo({
    status: HttpStatus.CREATED,
    summary: "Create a car manufacturer",
    successText: "Car manufacturer created successfully",
    type: CarManufacturerDto,
    errors: [Errors.CAR_MANUFACTURER_ALREADY_EXISTS],
  })
  async create(@Body() dto: CreateCarManufacturerDto) {
    const carManufacturer = await this.manufacturersService.create(dto);
    const data = this.manufacturersAdapter.getDto(carManufacturer);

    return data;
  }

  @Get()
  @Public()
  @ApiOperation({ summary: "List car manufacturers" })
  @SwaggerInfo({
    status: HttpStatus.OK,
    successText: "List of car manufacturers",
    type: [CarManufacturerDto],
  })
  async findAll(@Query() query: FindCarManufacturersQueryDto) {
    const carManufacturers = await this.manufacturersService.findAll(query);
    const data = this.manufacturersAdapter.getListDto(carManufacturers);

    return data;
  }

  @Get(":id")
  @Public()
  @SwaggerInfo({
    summary: "Get a car manufacturer",
    successText: "Car manufacturer successfully retrieved",
    type: CarManufacturerDto,
    errors: [Errors.CAR_MANUFACTURER_NOT_FOUND],
  })
  async findOne(@Param() params: CarManufacturerIdParamDto) {
    const carManufacturer = await this.manufacturersService.findById(params.id);
    if (!carManufacturer) {
      throw new AppError(Errors.CAR_MANUFACTURER_NOT_FOUND);
    }

    const data = this.manufacturersAdapter.getDto(carManufacturer);

    return data;
  }

  @Put(":id")
  @Roles("admin")
  @SwaggerInfo({
    summary: "Update a car manufacturer",
    successText: "Car manufacturer was successfully updated",
    type: CarManufacturerDto,
    errors: [Errors.CAR_MANUFACTURER_NOT_FOUND],
  })
  async update(
    @Param() params: CarManufacturerIdParamDto,
    @Body() dto: UpdateCarManufacturerDto,
  ) {
    const carManufacturer = await this.manufacturersService.update(
      params.id,
      dto,
    );

    return this.manufacturersAdapter.getDto(carManufacturer);
  }

  @Delete(":id")
  @Roles("admin")
  @SwaggerInfo({
    status: HttpStatus.NO_CONTENT,
    summary: "Delete a car manufacturer",
    successText: "Car manufacturer deleted successfully",
    type: null,
    errors: [Errors.CAR_MANUFACTURER_NOT_FOUND],
  })
  async remove(@Param() params: CarManufacturerIdParamDto) {
    await this.manufacturersService.delete(params.id);
  }
}
