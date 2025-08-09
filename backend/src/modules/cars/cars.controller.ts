import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from "@nestjs/swagger";
import { UUID } from "crypto";
import { BadRequest } from "src/common/decorators/bad-request-error.decorator";
import { NotFound } from "src/common/decorators/not-found-error.decorator";
import { zParam } from "src/common/decorators/z-param.decorator";
import { zQuery } from "src/common/decorators/z-query.decorator";
import { GeneralResponseDto } from "src/common/dto/general-response.dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import {
  limitSchema,
  skipSchema,
  uuidSchema,
} from "src/common/schemas/common.schema";
import {
  createResponseDto,
  createResponseListDto,
  wrapResponse,
} from "src/common/utils/common.utils";
import { CarsAdapter } from "./cars.adapter";
import { CarsService } from "./cars.service";
import { CarDto } from "./dto/car.dto";
import {
  carBrandSchema,
  carColorSchema,
  carModelSchema,
  CreateCarDto,
} from "./dto/create-car.dto";
import { UpdateCarDto } from "./dto/update-car.dto";
import { CarBrand } from "./entities/car.entity";

@Controller({ path: "cars", version: "1" })
export class CarsController {
  constructor(
    private readonly carsService: CarsService,
    private readonly carsAdapter: CarsAdapter,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a car" })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    type: createResponseDto(CarDto),
    description: "Car created successfully",
  })
  create(@Body() dto: CreateCarDto): GeneralResponseDto<CarDto> {
    const car = this.carsService.create(dto);
    const data = this.carsAdapter.getDto(car);
    return wrapResponse(data);
  }

  @Get()
  @ApiOperation({ summary: "List cars" })
  @ApiOkResponse({ type: createResponseListDto(CarDto) })
  @BadRequest()
  findAll(
    @zQuery("brand", carBrandSchema.optional()) brand?: CarBrand,
    @zQuery("model", carModelSchema.optional()) model?: string,
    @zQuery("color", carColorSchema.optional()) color?: string,
    @zQuery("skip", skipSchema.optional()) skip = 0,
    @zQuery("limit", limitSchema.optional()) limit = 20,
  ): GeneralResponseDto<PaginationDto<CarDto>> {
    const cars = this.carsService.findAll({ brand, model, skip, limit, color });
    const data = this.carsAdapter.getListDto(cars);
    return wrapResponse(data);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a car" })
  @ApiOkResponse({ type: CarDto })
  @BadRequest()
  @NotFound()
  findOne(@zParam("id", uuidSchema) id: UUID): CarDto {
    const car = this.carsService.findOne(id);
    return this.carsAdapter.getDto(car);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a car" })
  @ApiOkResponse({
    type: createResponseDto(CarDto),
    description: "Car succesfully updated",
  })
  update(
    @zParam("id", uuidSchema) id: UUID,
    @Body() dto: UpdateCarDto,
  ): GeneralResponseDto<CarDto> {
    const car = this.carsService.update(id, dto);
    const data = this.carsAdapter.getDto(car);
    return wrapResponse(data);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a car" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: "Car deleted successfully" })
  @BadRequest()
  @NotFound()
  remove(@zParam("id", uuidSchema) id: UUID) {
    this.carsService.remove(id);
  }
}
