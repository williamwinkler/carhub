import { Public } from "@api/common/decorators/public.decorator";
import { Roles } from "@api/common/decorators/roles.decorator";
import { zParam, zQuery } from "@api/common/decorators/zod.decorator";
import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import { SortDirection } from "@api/common/types/common.types";
import { SwaggerInfo } from "@api/common/utils/swagger.utils";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Post,
  Put,
} from "@nestjs/common";
import { UUID } from "crypto";
import {
  limitSchema,
  skipSchema,
  sortDirectionQuerySchema,
} from "../../common/schemas/common.schema";
import { CarModelsAdapter } from "./car-models.adapter";
import {
  carModelFields,
  CarModelSortField,
  carModelSortFieldQuerySchema,
} from "./car-models.schema";
import { CarModelsService } from "./car-models.service";
import { CarModelDto } from "./dto/car-model.dto";
import { CreateCarModelDto } from "./dto/create-car-model.dto";
import { UpdateCarModelDto } from "./dto/update-car-model.dto";

@Controller("car-models")
export class CarModelsController {
  constructor(
    private readonly carModelsService: CarModelsService,
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
  async findAll(
    @zQuery("manufacturerSlug", carModelFields.slug.optional())
    manufacturerSlug?: string,
    @zQuery("skip", skipSchema.optional()) skip = 0,
    @zQuery("limit", limitSchema.optional()) limit = 20,
    @zQuery("sortField", carModelSortFieldQuerySchema)
    sortField?: CarModelSortField,
    @zQuery("sortDirection", sortDirectionQuerySchema)
    sortDirection?: SortDirection,
  ) {
    const carModels = await this.carModelsService.findAll({
      manufacturerSlug,
      skip,
      limit,
      sortField,
      sortDirection,
    });
    const data = this.carModelsAdapter.getListDto(carModels);

    return data;
  }

  @Get(":id")
  @Public()
  @SwaggerInfo({
    summary: "Get a car model",
    successText: "Car model successfully retrieved",
    type: CarModelDto,
    errors: [Errors.CAR_MODEL_NOT_FOUND],
  })
  async findOne(@zParam("id", carModelFields.id) id: UUID) {
    const carModel = await this.carModelsService.findById(id);
    if (!carModel) {
      throw new AppError(Errors.CAR_MODEL_NOT_FOUND);
    }

    const data = this.carModelsAdapter.getDto(carModel);

    return data;
  }

  @Get("slug/:slug")
  @Public()
  @SwaggerInfo({
    summary: "Get a car model by it's slug",
    successText: "Car model succesfully retrieved",
    type: CarModelDto,
    errors: [Errors.CAR_MODEL_NOT_FOUND],
  })
  async findBySlug(@zParam("slug", carModelFields.slug) slug: string) {
    const carModel = await this.carModelsService.findBySlug(slug);
    if (!carModel) {
      throw new AppError(Errors.CAR_MODEL_NOT_FOUND);
    }

    return this.carModelsAdapter.getDto(carModel);
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
    @zParam("id", carModelFields.id) id: UUID,
    @Body() dto: UpdateCarModelDto,
  ) {
    const carModel = await this.carModelsService.update(id, dto);

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
  async remove(@zParam("id", carModelFields.id) id: UUID) {
    await this.carModelsService.delete(id);
  }
}
