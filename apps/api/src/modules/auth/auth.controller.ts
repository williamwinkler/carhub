import { BadRequest } from "@api/common/decorators/bad-request-error.decorator";
import { ApiResponseDto } from "@api/common/utils/swagger.utils";
import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtDto } from "./dto/jwt.dto";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.CREATED)
  @ApiResponseDto({
    status: HttpStatus.CREATED,
    type: JwtDto,
  })
  @BadRequest()
  // TODO: Unauthorized
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }
}
