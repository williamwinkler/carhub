import { Public } from "@api/common/decorators/public.decorator";
import { Roles } from "@api/common/decorators/roles.decorator";
import { NotFoundDecorator } from "@api/common/decorators/swagger-responses.decorator";
import { zParam, zQuery } from "@api/common/decorators/zod.decorator";
import { ApiEndpoint } from "@api/common/utils/swagger.utils";
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
import { UUID } from "crypto";
import {
  limitSchema,
  skipSchema,
  sortDirectionQuerySchema,
  sortFieldQuerySchema,
} from "../../common/schemas/common.schema";
import { CarsAdapter } from "./cars.adapter";
import { CarsService } from "./cars.service";
import { SortDirection, SortField } from "./cars.type";
import { CarDto, carIdSchema } from "./dto/car.dto";
import {
  carBrandSchema,
  carColorSchema,
  carModelSchema,
  CreateCarDto,
} from "./dto/create-car.dto";
import { UpdateCarDto } from "./dto/update-car.dto";
import { CarBrandType } from "./entities/car.entity";

@Controller("cars")
export class CarsController {
  constructor(
    private readonly carsService: CarsService,
    private readonly carsAdapter: CarsAdapter,
  ) {}

  @Post()
  @Roles("user")
  @ApiEndpoint({
    status: HttpStatus.CREATED,
    summary: "Create a car",
    successText: "ar created successfully",
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
  @ApiEndpoint({
    status: HttpStatus.CREATED,
    successText: "ist of cars",
    type: [CarDto],
  })
  async findAll(
    @zQuery("brand", carBrandSchema.optional()) brand?: CarBrandType,
    @zQuery("model", carModelSchema.optional()) model?: string,
    @zQuery("color", carColorSchema.optional()) color?: string,
    @zQuery("skip", skipSchema.optional()) skip = 0,
    @zQuery("limit", limitSchema.optional()) limit = 20,
    @zQuery("sortField", sortFieldQuerySchema) sortField?: SortField,
    @zQuery("sortDirection", sortDirectionQuerySchema)
    sortDirection?: SortDirection,
  ) {
    const cars = this.carsService.findAll({
      brand,
      model,
      color,
      skip,
      limit,
      sortField,
      sortDirection,
    });
    const data = this.carsAdapter.getListDto(cars);

    // (data.items as any)[2].whoops = "should not be here";

    return data;
  }

  @Get(":id")
  @Public()
  @ApiEndpoint({
    summary: "Get a car",
    successText: "Car successfully retrieved",
    type: CarDto,
  })
  @NotFoundDecorator()
  async findOne(@zParam("id", carIdSchema) id: UUID) {
    const car = this.carsService.findById(id);
    const data = this.carsAdapter.getDto(car);

    // (data as any).not_okay = "should not be here";

    return data;
  }

  @Put(":id")
  @Roles("user")
  @ApiEndpoint({
    summary: "Update a car",
    successText: "car was successfully updated",
    type: CarDto,
  })
  @NotFoundDecorator()
  async update(@zParam("id", carIdSchema) id: UUID, @Body() dto: UpdateCarDto) {
    const car = this.carsService.update(id, dto);

    return this.carsAdapter.getDto(car);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a car" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles("user")
  @ApiNoContentResponse({ description: "Car deleted successfully" })
  @NotFoundDecorator()
  async remove(@zParam("id", carIdSchema) id: UUID) {
    this.carsService.delete(id);
  }
}
