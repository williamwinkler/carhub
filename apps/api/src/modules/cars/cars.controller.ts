import { Ctx } from "@api/common/ctx";
import { Public } from "@api/common/decorators/public.decorator";
import { Roles } from "@api/common/decorators/roles.decorator";
import { ApiErrorResponse } from "@api/common/decorators/swagger-responses.decorator";
import { zParam, zQuery } from "@api/common/decorators/zod.decorator";
import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import { SortDirection } from "@api/common/types/common.types";
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
} from "../../common/schemas/common.schema";
import { CarsAdapter } from "./cars.adapter";
import { carFields, carSortFieldQuerySchema } from "./cars.schema";
import { CarsService } from "./cars.service";
import { CarSortField } from "./cars.types";
import { CarDto } from "./dto/car.dto";
import { CreateCarDto } from "./dto/create-car.dto";
import { UpdateCarDto } from "./dto/update-car.dto";
import { carManufacturerFields } from "../car-manufacturers/car-manufacturers.schema";
import { carModelFields } from "../car-models/car-models.schema";

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
    successText: "Car created successfully",
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
    status: HttpStatus.OK,
    successText: "List of cars",
    type: [CarDto],
  })
  async findAll(
    @zQuery("modelId", carModelFields.id.optional())
    modelId?: UUID,
    @zQuery("manufacturerId", carManufacturerFields.id.optional())
    manufacturerId?: UUID,
    @zQuery("color", carFields.color.optional()) color?: string,
    @zQuery("skip", skipSchema.optional()) skip = 0,
    @zQuery("limit", limitSchema.optional()) limit = 20,
    @zQuery("sortField", carSortFieldQuerySchema)
    sortField?: CarSortField,
    @zQuery("sortDirection", sortDirectionQuerySchema)
    sortDirection?: SortDirection,
  ) {
    const cars = await this.carsService.findAll({
      modelId,
      manufacturerId,
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
  @ApiErrorResponse(Errors.CAR_NOT_FOUND)
  async findOne(@zParam("id", carFields.id) id: UUID) {
    const car = await this.carsService.findById(id);
    if (!car) {
      throw new AppError(Errors.CAR_NOT_FOUND);
    }

    const data = this.carsAdapter.getDto(car);

    return data;
  }

  @Put(":id")
  @Roles("user")
  @ApiEndpoint({
    summary: "Update a car",
    successText: "Car was successfully updated",
    type: CarDto,
  })
  @ApiErrorResponse(Errors.CAR_NOT_FOUND)
  async update(
    @zParam("id", carFields.id) id: UUID,
    @Body() dto: UpdateCarDto,
  ) {
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
  @ApiErrorResponse(Errors.CAR_NOT_FOUND)
  async remove(@zParam("id", carFields.id) id: UUID) {
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
  @ApiErrorResponse(Errors.CAR_NOT_FOUND)
  async toggleFavorite(@zParam("id", carFields.id) id: UUID) {
    const userId = Ctx.userIdRequired();
    await this.carsService.toggleFavoriteForUser(id, userId);
  }

  @Get("favorites")
  @Roles("user")
  @ApiEndpoint({
    summary: "Get user's favorite cars",
    successText: "User's favorite cars retrieved successfully",
    type: [CarDto],
  })
  async getFavorites(
    @zQuery("skip", skipSchema.optional()) skip = 0,
    @zQuery("limit", limitSchema.optional()) limit = 20,
  ) {
    const userId = Ctx.userIdRequired();
    const favorites = await this.carsService.getFavoritesByUser({
      userId,
      skip,
      limit,
    });
    const data = this.carsAdapter.getListDto(favorites);

    return data;
  }
}
