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
import { CarModelsAdapter } from "./car-models.adapter";
import { CarModelsService } from "./car-models.service";
import { CarModelDto } from "./dto/car-model.dto";
import type {
  CarModelIdParamDto,
  CarModelSlugParamDto,
  FindCarModelsQueryDto,
} from "./dto/car-model-query.dto";
import type { CreateCarModelDto } from "./dto/create-car-model.dto";
import type { UpdateCarModelDto } from "./dto/update-car-model.dto";

@Controller("car-models")
export class CarModelsController {
  constructor(
    @Inject(CarModelsService)
    private readonly carModelsService: CarModelsService,
    @Inject(CarModelsAdapter)
    private readonly carModelsAdapter: CarModelsAdapter,
  ) {}

  @Post()
  @Roles("admin")
  @SwaggerInfo({
    status: HttpStatus.CREATED,
    summary: "Create a car model",
    successText: "Car model created successfully",
    type: CarModelDto,
    errors: [Errors.CAR_MANUFACTURER_NOT_FOUND],
  })
  async create(@Body() dto: CreateCarModelDto) {
    const carModel = await this.carModelsService.create(dto);
    const data = this.carModelsAdapter.getDto(carModel);

    return data;
  }

  @Get()
  @Public()
  @SwaggerInfo({
    status: HttpStatus.OK,
    summary: "List car models",
    successText: "List of car models",
    type: [CarModelDto],
  })
  async findAll(@Query() query: FindCarModelsQueryDto) {
    const carModels = await this.carModelsService.findAll(query);
    return this.carModelsAdapter.getListDto(carModels);
  }

  @Get("slug/:slug")
  @Public()
  @SwaggerInfo({
    summary: "Get a car model by its slug",
    successText: "Car model successfully retrieved",
    type: CarModelDto,
    errors: [Errors.CAR_MODEL_NOT_FOUND],
  })
  async findBySlug(@Param() params: CarModelSlugParamDto) {
    const carModel = await this.carModelsService.findBySlug(params.slug);
    if (!carModel) {
      throw new AppError(Errors.CAR_MODEL_NOT_FOUND);
    }

    return this.carModelsAdapter.getDto(carModel);
  }

  @Get(":id")
  @Public()
  @SwaggerInfo({
    summary: "Get a car model",
    successText: "Car model successfully retrieved",
    type: CarModelDto,
    errors: [Errors.CAR_MODEL_NOT_FOUND],
  })
  async findOne(@Param() params: CarModelIdParamDto) {
    const carModel = await this.carModelsService.findById(params.id);
    if (!carModel) {
      throw new AppError(Errors.CAR_MODEL_NOT_FOUND);
    }

    const data = this.carModelsAdapter.getDto(carModel);

    return data;
  }

  @Put(":id")
  @Roles("admin")
  @SwaggerInfo({
    summary: "Update a car model",
    successText: "Car model was successfully updated",
    type: CarModelDto,
    errors: [Errors.CAR_MODEL_NOT_FOUND],
  })
  async update(
    @Param() params: CarModelIdParamDto,
    @Body() dto: UpdateCarModelDto,
  ) {
    const carModel = await this.carModelsService.update(params.id, dto);

    return this.carModelsAdapter.getDto(carModel);
  }

  @Delete(":id")
  @Roles("admin")
  @SwaggerInfo({
    status: HttpStatus.NO_CONTENT,
    summary: "Delete a car model",
    successText: "Car model deleted successfully",
    type: null,
    errors: [Errors.CAR_MODEL_NOT_FOUND],
  })
  async remove(@Param() params: CarModelIdParamDto) {
    await this.carModelsService.delete(params.id);
  }
}
