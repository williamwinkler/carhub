import { Ctx } from "@api/common/ctx";
import { Roles } from "@api/common/decorators/roles.decorator";
import { ApiEndpoint } from "@api/common/utils/swagger.utils";
import { UsersService } from "@api/modules/users/users.service";
import { Controller, Get } from "@nestjs/common";
import { UserDto } from "./dto/user.dto";
import { UsersAdapter } from "./users.adapter";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersAdapter: UsersAdapter,
  ) {}

  @Get("me")
  @Roles("user")
  @ApiEndpoint({
    summary: "Get my user information",
    successText: "User information retrieved",
    type: UserDto,
  })
  async getMe() {
    const userId = Ctx.userIdRequired();
    const user = await this.usersService.findById(userId);

    return this.usersAdapter.getUserDto(user!);
  }
}
