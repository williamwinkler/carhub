import { Public } from "@api/common/decorators/public.decorator";
import { ApiErrorResponse } from "@api/common/decorators/swagger-responses.decorator";
import { Errors } from "@api/common/errors/errors";
import { ApiEndpoint } from "@api/common/utils/swagger.utils";
import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiNoContentResponse } from "@nestjs/swagger";
import { UserDto } from "../users/dto/user.dto";
import { UsersAdapter } from "../users/users.adapter";
import { AuthService } from "./auth.service";
import { ApiKeyDto } from "./dto/apiKey.dto";
import { JwtDto } from "./dto/jwt.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersAdapter: UsersAdapter,
  ) {}

  @Post("register")
  @Public()
  @ApiEndpoint({
    status: HttpStatus.CREATED,
    summary: "Register an account",
    successText: "Account created successfully",
    type: UserDto,
  })
  @ApiErrorResponse(Errors.USERNAME_ALREADY_EXISTS)
  async createAccount(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);

    return this.usersAdapter.getUserDto(user);
  }

  @Post("login")
  @Public()
  @ApiEndpoint({
    status: HttpStatus.CREATED,
    successText: "User successfully logged in",
    type: JwtDto,
  })
  @ApiErrorResponse(Errors.INVALID_CREDENTIALS)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Post("refresh")
  @Public()
  @ApiEndpoint({
    status: HttpStatus.CREATED,
    summary: "Get a new access token with your refresh token",
    successText: "Session succesfully refreshed",
    type: JwtDto,
  })
  @ApiErrorResponse(Errors.INVALID_REFRESH_TOKEN)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: "User logged out successfully" })
  async logout() {
    await this.authService.logout();
  }

  @Post("apiKey")
  @ApiEndpoint({
    status: HttpStatus.CREATED,
    summary: "Generate an API key",
    successText: "The API key was successfully generated",
    type: ApiKeyDto,
  })
  async createApiKey() {
    const apiKey = await this.authService.createApiKey();

    return { apiKey };
  }
}
