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
import { CarManufacturersAdapter } from "./car-manufacturers.adapter";
import {
  carManufacturerFields,
  CarManufacturerSortField,
  carManufacturerSortFieldQuerySchema,
} from "./car-manufacturers.schema";
import { CarManufacturersService } from "./car-manufacturers.service";
import { CarManufacturerDto } from "./dto/car-manufacturer.dto";
import { CreateCarManufacturerDto } from "./dto/create-car-manufacturer.dto";
import { UpdateCarManufacturerDto } from "./dto/update-car-manufacturer.dto";

@Controller("car-manufacturers")
export class CarManufacturersController {
  constructor(
    private readonly manufacturersService: CarManufacturersService,
    private readonly manufacturersAdapter: CarManufacturersAdapter,
  ) {}

  @Post()
  @Roles("admin")
  @ApiEndpoint({
    status: HttpStatus.CREATED,
    summary: "Create a car manufacturer",
    successText: "Car manufacturer created successfully",
    type: CarManufacturerDto,
  })
  @ApiErrorResponse(Errors.CAR_MANUFACTURER_ALREADY_EXISTS)
  async create(@Body() dto: CreateCarManufacturerDto) {
    const carManufacturer = await this.manufacturersService.create(dto);
    const data = this.manufacturersAdapter.getDto(carManufacturer);

    return data;
  }

  @Get()
  @Public()
  @ApiOperation({ summary: "List car manufacturers" })
  @ApiEndpoint({
    status: HttpStatus.OK,
    successText: "List of car manufacturers",
    type: [CarManufacturerDto],
  })
  async findAll(
    @zQuery("skip", skipSchema.optional()) skip = 0,
    @zQuery("limit", limitSchema.optional()) limit = 20,
    @zQuery("sortField", carManufacturerSortFieldQuerySchema)
    sortField?: CarManufacturerSortField,
    @zQuery("sortDirection", sortDirectionQuerySchema)
    sortDirection?: SortDirection,
  ) {
    const carManufacturers = await this.manufacturersService.findAll({
      skip,
      limit,
      sortField,
      sortDirection,
    });
    const data = this.manufacturersAdapter.getListDto(carManufacturers);

    return data;
  }

  @Get(":id")
  @Public()
  @ApiEndpoint({
    summary: "Get a car manufacturer",
    successText: "Car manufacturer successfully retrieved",
    type: CarManufacturerDto,
  })
  @ApiErrorResponse(Errors.CAR_MANUFACTURER_NOT_FOUND)
  async findOne(@zParam("id", carManufacturerFields.id) id: UUID) {
    const carManufacturer = await this.manufacturersService.findById(id);
    if (!carManufacturer) {
      throw new AppError(Errors.CAR_MANUFACTURER_NOT_FOUND);
    }

    const data = this.manufacturersAdapter.getDto(carManufacturer);

    return data;
  }

  @Put(":id")
  @Roles("admin")
  @ApiEndpoint({
    summary: "Update a car manufacturer",
    successText: "Car manufacturer was successfully updated",
    type: CarManufacturerDto,
  })
  @ApiErrorResponse(Errors.CAR_MANUFACTURER_NOT_FOUND)
  async update(
    @zParam("id", carManufacturerFields.id) id: UUID,
    @Body() dto: UpdateCarManufacturerDto,
  ) {
    const carManufacturer = await this.manufacturersService.update(id, dto);

    return this.manufacturersAdapter.getDto(carManufacturer);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiEndpoint({
    status: HttpStatus.NO_CONTENT,
    summary: "Delete a car manufacturer",
    successText: "Car manufacturer deleted successfully",
    type: null,
  })
  @ApiErrorResponse(Errors.CAR_MANUFACTURER_NOT_FOUND)
  async remove(@zParam("id", carManufacturerFields.id) id: UUID) {
    await this.manufacturersService.delete(id);
  }
}
