import { BadRequest, Unauthorized } from "@api/common/decorators/swagger-responses.decorator";
import { ApiResponseDto } from "@api/common/utils/swagger.utils";
import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtDto } from "./dto/jwt.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { Public } from "@api/common/decorators/public.decorator";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponseDto({
    status: HttpStatus.CREATED,
    type: JwtDto,
  })
  @BadRequest()
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Post("refresh")
  @Public()
  @ApiResponseDto({
    status: HttpStatus.OK,
    type: JwtDto,
  })
  @BadRequest()
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Unauthorized()
  async logout() {
    await this.authService.logout("TODO")
  }

}
