import { wrapResponse } from "@api/common/utils/common.utils";
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
import { CarBrandType } from "@repo/shared";
import { UUID } from "crypto";
import { BadRequest } from "../../common/decorators/bad-request-error.decorator";
import { NotFound } from "../../common/decorators/not-found-error.decorator";
import { zParam } from "../../common/decorators/z-param.decorator";
import { zQuery } from "../../common/decorators/z-query.decorator";
import { GeneralResponseDto } from "../../common/dto/general-response.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import {
  limitSchema,
  skipSchema,
  uuidSchema,
} from "../../common/schemas/common.schema";
import {
  ApiResponseDto,
  ApiResponseListDto,
} from "../../common/utils/swagger.utils";
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
    type: ApiResponseDto(CarDto),
    description: "Car created successfully",
  })
  create(@Body() dto: CreateCarDto): GeneralResponseDto<CarDto> {
    const car = this.carsService.create(dto);
    const data = this.carsAdapter.getDto(car);

    return wrapResponse(data);
  }

  @Get()
  @ApiOperation({ summary: "List cars" })
  @ApiOkResponse({ type: ApiResponseListDto(CarDto) })
  @BadRequest()
  findAll(
    @zQuery("brand", carBrandSchema.optional()) brand?: CarBrandType,
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
  @ApiOkResponse({ type: ApiResponseDto(CarDto) })
  @BadRequest()
  @NotFound()
  findOne(@zParam("id", uuidSchema) id: UUID): CarDto {
    const car = this.carsService.findById(id);

    return this.carsAdapter.getDto(car);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a car" })
  @ApiOkResponse({
    type: ApiResponseDto(CarDto),
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
