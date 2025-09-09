import { BearerAuth } from "@api/common/decorators/bearer.decorator";
import { ApiResponseDto } from "@api/common/utils/swagger.utils";
import { Controller, Get, HttpStatus } from "@nestjs/common";
import { MeDto } from "./dto/me.dto";
import { UsersAdapter } from "./users.adapter";
import { UsersService } from "./users.service";
import { Ctx } from "@api/common/ctx";
import { UserNotFoundError } from "@api/common/errors/domain/not-found.error";

@Controller("users")
export class UsersController {
  constructor(
    private usersService: UsersService,
    private usersAdapter: UsersAdapter,
  ) {}

  @Get("me")
  @BearerAuth()
  @ApiResponseDto({
    status: HttpStatus.OK,
    type: MeDto,
    description: "Successfully retrieved user details",
  })
  async getMe() {
    const me = await this.usersService.findById(Ctx.userIdRequired());
    if (!me) throw new UserNotFoundError();
    return this.usersAdapter.getMeDto(me);
  }
}
