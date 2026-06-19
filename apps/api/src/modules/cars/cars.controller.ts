import { Ctx } from "@api/common/ctx";
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
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { CarsAdapter } from "./cars.adapter";
import { CarsService } from "./cars.service";
import { CarDto } from "./dto/car.dto";
import type {
  CarIdParamDto,
  FavoriteCarsQueryDto,
  FindCarsQueryDto,
} from "./dto/cars-query.dto";
import type { CreateCarDto } from "./dto/create-car.dto";
import type { UpdateCarDto } from "./dto/update-car.dto";

@Controller({ path: "cars", version: "1" })
export class CarsController {
  constructor(
    @Inject(CarsService) private readonly carsService: CarsService,
    @Inject(CarsAdapter) private readonly carsAdapter: CarsAdapter,
  ) {}

  @Post()
  @Roles("user")
  @SwaggerInfo({
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
  @SwaggerInfo({
    status: HttpStatus.OK,
    summary: "List cars",
    successText: "List of cars",
    type: [CarDto],
  })
  async findAll(@Query() query: FindCarsQueryDto) {
    const cars = await this.carsService.findAll(query);
    const data = this.carsAdapter.getListDto(cars);

    return data;
  }

  @Get("favorites")
  @Roles("user")
  @SwaggerInfo({
    summary: "Get user's favorite cars",
    successText: "User's favorite cars retrieved successfully",
    type: [CarDto],
  })
  async getFavorites(@Query() query: FavoriteCarsQueryDto) {
    const userId = Ctx.userIdRequired();
    const favorites = await this.carsService.getFavoritesByUser({
      userId,
      skip: query.skip,
      limit: query.limit,
    });
    const data = this.carsAdapter.getListDto(favorites);

    return data;
  }

  @Get(":id")
  @Public()
  @SwaggerInfo({
    summary: "Get a car",
    successText: "Car successfully retrieved",
    type: CarDto,
    errors: [Errors.CAR_NOT_FOUND],
  })
  async findOne(@Param() params: CarIdParamDto) {
    const car = await this.carsService.findById(params.id);
    if (!car) {
      throw new AppError(Errors.CAR_NOT_FOUND);
    }

    const data = this.carsAdapter.getDto(car);

    return data;
  }

  @Put(":id")
  @Roles("user")
  @SwaggerInfo({
    summary: "Update a car",
    successText: "Car was successfully updated",
    type: CarDto,
    errors: [Errors.CAR_NOT_FOUND, Errors.CAR_MODEL_NOT_FOUND],
  })
  async update(@Param() params: CarIdParamDto, @Body() dto: UpdateCarDto) {
    const car = await this.carsService.update(params.id, dto);

    return this.carsAdapter.getDto(car);
  }

  @Delete(":id")
  @Roles("user")
  @SwaggerInfo({
    status: HttpStatus.NO_CONTENT,
    summary: "Delete a car",
    successText: "Car deleted successfully",
    type: null,
    errors: [Errors.CAR_NOT_FOUND],
  })
  async remove(@Param() params: CarIdParamDto) {
    await this.carsService.softDelete(params.id);
  }

  @Patch(":id/favorite")
  @Roles("user")
  @SwaggerInfo({
    status: HttpStatus.NO_CONTENT,
    summary: "Toggle favorite status for a car",
    successText: "Car favorite status toggled successfully",
    type: null,
    errors: [Errors.CAR_NOT_FOUND],
  })
  async toggleFavorite(@Param() params: CarIdParamDto) {
    const userId = Ctx.userIdRequired();
    await this.carsService.toggleFavoriteForUser(params.id, userId);
  }
}
