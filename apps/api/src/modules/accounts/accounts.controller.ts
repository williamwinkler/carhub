import { Ctx } from "@api/common/ctx";
import { Roles } from "@api/common/decorators/roles.decorator";
import { ApiEndpoint } from "@api/common/utils/swagger.utils";
import { UsersService } from "@api/modules/users/users.service";
import { Controller, Get } from "@nestjs/common";
import { AccountDto } from "./dto/account.dto";
import { AccountsAdapter } from "./acounts.adapter";

@Controller("accounts")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly accountsAdapter: AccountsAdapter,
  ) {}

  @Get("me")
  @Roles("user")
  @ApiEndpoint({
    summary: "Get my account information",
    successText: "Account information retrieved",
    type: AccountDto,
  })
  async getMe() {
    const userId = Ctx.userIdRequired();
    const user = await this.usersService.findById(userId);

    return this.accountsAdapter.getDto(user!);
  }
}
