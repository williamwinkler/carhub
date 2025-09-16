import { Ctx } from "@api/common/ctx";
import { Public } from "@api/common/decorators/public.decorator";
import { Roles } from "@api/common/decorators/roles.decorator";
import { NotFoundDecorator } from "@api/common/decorators/swagger-responses.decorator";
import { zParam, zQuery } from "@api/common/decorators/zod.decorator";
import { CarNotFoundError } from "@api/common/errors/domain/not-found.error";
import { ApiEndpoint } from "@api/common/utils/swagger.utils";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Patch,
  Post,
  Put,
} from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { UUID } from "crypto";
import {
  limitSchema,
  skipSchema,
  sortDirectionQuerySchema,
  sortFieldQuerySchema,
} from "../../common/schemas/common.schema";
import { CarsAdapter } from "./cars.adapter";
import { CarsService } from "./cars.service";
import { SortDirection, SortField } from "./cars.types";
import { CarDto, carIdSchema } from "./dto/car.dto";
import { carColorSchema, CreateCarDto } from "./dto/create-car.dto";
import { UpdateCarDto } from "./dto/update-car.dto";

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
    const car = await this.carsService.create(dto);
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
    @zQuery("modelId", carIdSchema.optional()) modelId?: UUID,
    @zQuery("color", carColorSchema.optional()) color?: string,
    @zQuery("skip", skipSchema.optional()) skip = 0,
    @zQuery("limit", limitSchema.optional()) limit = 20,
    @zQuery("sortField", sortFieldQuerySchema) sortField?: SortField,
    @zQuery("sortDirection", sortDirectionQuerySchema)
    sortDirection?: SortDirection,
  ) {
    const cars = await this.carsService.findAll({
      modelId,
      color,
      skip,
      limit,
      sortField,
      sortDirection,
    });
    const data = this.carsAdapter.getListDto(cars);

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
    const car = await this.carsService.findById(id);
    if (!car) {
      throw new CarNotFoundError();
    }

    const data = this.carsAdapter.getDto(car);

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
    const car = await this.carsService.update(id, dto);

    return this.carsAdapter.getDto(car);
  }

  @Delete(":id")
  @Roles("user")
  @ApiEndpoint({
    status: HttpStatus.NO_CONTENT,
    summary: "Delete a car",
    successText: "Car deleted successfully",
    type: null,
  })
  @NotFoundDecorator()
  async remove(@zParam("id", carIdSchema) id: UUID) {
    await this.carsService.softDelete(id);
  }

  @Patch(":id/favorite")
  @Roles("user")
  @ApiEndpoint({
    status: HttpStatus.NO_CONTENT,
    summary: "Toggle favorite status for a car",
    successText: "Car favorite status toggled successfully",
    type: null,
  })
  @NotFoundDecorator()
  async toggleFavorite(@zParam("id", carIdSchema) id: UUID) {
    const userId = Ctx.userIdRequired();
    await this.carsService.toggleFavoriteForUser(id, userId);
  }
}
