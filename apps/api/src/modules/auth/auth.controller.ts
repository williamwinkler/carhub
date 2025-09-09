import { BearerAuth } from "@api/common/decorators/bearer.decorator";
import { Public } from "@api/common/decorators/public.decorator";
import { BadRequest } from "@api/common/decorators/swagger-responses.decorator";
import { ApiResponseDto } from "@api/common/utils/swagger.utils";
import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiNoContentResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { JwtDto } from "./dto/jwt.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  @Public()
  @ApiResponseDto({
    status: HttpStatus.CREATED,
    type: JwtDto,
    description: "User successfully logged in",
  })
  @BadRequest()
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Post("refresh")
  @Public()
  @ApiResponseDto({
    status: HttpStatus.CREATED,
    type: JwtDto,
    description: "Session succesfully refreshed",
  })
  @BadRequest()
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @BearerAuth()
  @ApiNoContentResponse({ description: "User logged out successfully" })
  async logout() {
    await this.authService.logout();
  }
}
