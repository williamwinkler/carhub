import { zParam, zQuery } from "@api/common/decorators/zod.decorator";
import { ApiResponseDto } from "@api/common/utils/swagger.utils";
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
import { ApiNoContentResponse, ApiOperation } from "@nestjs/swagger";
import { CarBrandType } from "@repo/shared";
import { UUID } from "crypto";
import {
  limitSchema,
  skipSchema,
  uuidSchema,
} from "../../common/schemas/common.schema";
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
import { BadRequest, NotFound } from "@api/common/decorators/swagger-responses.decorator";

@Controller("cars")
export class CarsController {
  constructor(
    private readonly carsService: CarsService,
    private readonly carsAdapter: CarsAdapter,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a car" })
  @HttpCode(HttpStatus.CREATED)
  @ApiResponseDto({
    status: HttpStatus.CREATED,
    description: "Car created successfully",
    type: CarDto,
  })
  @BadRequest()
  async create(@Body() dto: CreateCarDto) {
    const car = this.carsService.create(dto);

    return this.carsAdapter.getDto(car);
  }

  @Get()
  @ApiOperation({ summary: "List cars" })
  @BadRequest()
  @ApiResponseDto({
    status: HttpStatus.OK,
    description: "List of cars",
    type: [CarDto],
  })
  async findAll(
    @zQuery("brand", carBrandSchema.optional()) brand?: CarBrandType,
    @zQuery("model", carModelSchema.optional()) model?: string,
    @zQuery("color", carColorSchema.optional()) color?: string,
    @zQuery("skip", skipSchema.optional()) skip = 0,
    @zQuery("limit", limitSchema.optional()) limit = 20,
  ) {
    const cars = this.carsService.findAll({ brand, model, skip, limit, color });

    return this.carsAdapter.getListDto(cars);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a car" })
  @ApiResponseDto({
    description: "Car successfully retrieved",
    type: CarDto,
  })
  @BadRequest()
  @NotFound()
  async findOne(@zParam("id", uuidSchema) id: UUID) {
    const car = this.carsService.findById(id);

    return this.carsAdapter.getDto(car);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a car" })
  @ApiResponseDto({
    description: "The car was successfully updated",
    type: CarDto,
  })
  @BadRequest()
  @NotFound()
  async update(@zParam("id", uuidSchema) id: UUID, @Body() dto: UpdateCarDto) {
    const car = this.carsService.update(id, dto);

    return this.carsAdapter.getDto(car);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a car" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: "Car deleted successfully" })
  @BadRequest()
  @NotFound()
  async remove(@zParam("id", uuidSchema) id: UUID) {
    this.carsService.remove(id);
  }
}
