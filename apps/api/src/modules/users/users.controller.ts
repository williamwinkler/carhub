import { Ctx } from "@api/common/ctx";
import { Roles } from "@api/common/decorators/roles.decorator";
import { zQuery } from "@api/common/decorators/zod.decorator";
import { ApiEndpoint } from "@api/common/utils/swagger.utils";
import { Controller, Get } from "@nestjs/common";
import { limitSchema, skipSchema } from "../../common/schemas/common.schema";
import { CarsAdapter } from "../cars/cars.adapter";
import { CarsService } from "../cars/cars.service";
import { CarDto } from "../cars/dto/car.dto";

@Controller("users")
export class UsersController {
  constructor(
    private readonly carsService: CarsService,
    private readonly carsAdapter: CarsAdapter,
  ) {}

  @Get("me/favorite-cars")
  @Roles("user")
  @ApiEndpoint({
    summary: "Get current user's favorite cars",
    successText: "User favorites retrieved successfully",
    type: [CarDto],
  })
  async getMyFavoriteCars(
    @zQuery("skip", skipSchema.optional()) skip = 0,
    @zQuery("limit", limitSchema.optional()) limit = 20,
  ) {
    const userId = Ctx.userIdRequired();
    const data = await this.carsService.getFavoritesByUser({
      userId,
      skip,
      limit,
    });

    return this.carsAdapter.getListDto(data);
  }
}
