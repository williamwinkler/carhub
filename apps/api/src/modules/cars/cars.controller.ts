import { BearerAuth } from "@api/common/decorators/bearer.decorator";
import { Public } from "@api/common/decorators/public.decorator";
import { Roles } from "@api/common/decorators/roles.decorator";
import { NotFound } from "@api/common/decorators/swagger-responses.decorator";
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

@Controller("cars")
export class CarsController {
  constructor(
    private readonly carsService: CarsService,
    private readonly carsAdapter: CarsAdapter,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a car" })
  @Roles("user")
  @BearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponseDto({
    status: HttpStatus.CREATED,
    description: "Car created successfully",
    type: CarDto,
  })
  async create(@Body() dto: CreateCarDto) {
    const car = this.carsService.create(dto);
    const data = this.carsAdapter.getDto(car);

    return data;
  }

  @Get()
  @Public()
  @ApiOperation({ summary: "List cars" })
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
    const data = this.carsAdapter.getListDto(cars);

    return data;
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Get a car" })
  @ApiResponseDto({
    description: "Car successfully retrieved",
    type: CarDto,
  })
  @NotFound()
  async findOne(@zParam("id", uuidSchema) id: UUID) {
    const car = this.carsService.findById(id);
    const data = this.carsAdapter.getDto(car);

    return data;
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a car" })
  @Roles("user")
  @BearerAuth()
  @ApiResponseDto({
    description: "The car was successfully updated",
    type: CarDto,
  })
  @NotFound()
  async update(@zParam("id", uuidSchema) id: UUID, @Body() dto: UpdateCarDto) {
    const car = this.carsService.update(id, dto);

    return this.carsAdapter.getDto(car);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a car" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles("user")
  @BearerAuth()
  @ApiNoContentResponse({ description: "Car deleted successfully" })
  @NotFound()
  async remove(@zParam("id", uuidSchema) id: UUID) {
    this.carsService.remove(id);
  }
}
