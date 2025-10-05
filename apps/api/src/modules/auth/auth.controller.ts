import { Controller } from "@nestjs/common";
import { AccountsAdapter } from "../accounts/acounts.adapter";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly accountsAdapter: AccountsAdapter,
  ) {}

  // @Post("register")
  // @Public()
  // @SwaggerInfo({
  //   status: HttpStatus.CREATED,
  //   summary: "Register an account",
  //   successText: "Account created successfully",
  //   type: AccountDto,
  //   errors: [Errors.USERNAME_ALREADY_EXISTS],
  // })
  // async createAccount(@Body() registerDto: RegisterDto) {
  //   const user = await this.authService.register(registerDto);

  //   return this.accountsAdapter.getDto(user);
  // }

  // @Post("login")
  // @Public()
  // @SwaggerInfo({
  //   status: HttpStatus.CREATED,
  //   successText: "User successfully logged in",
  //   type: JwtDto,
  //   errors: [Errors.INVALID_CREDENTIALS],
  // })
  // async login(@Body() dto: LoginDto) {
  //   return this.authService.login(dto.username, dto.password);
  // }

  // @Post("refresh")
  // @Public()
  // @SwaggerInfo({
  //   status: HttpStatus.CREATED,
  //   summary: "Get a new access token with your refresh token",
  //   successText: "Session succesfully refreshed",
  //   type: JwtDto,
  //   errors: [Errors.INVALID_REFRESH_TOKEN],
  // })
  // async refresh(@Body() dto: RefreshTokenDto) {
  //   return this.authService.refreshToken(dto.refreshToken);
  // }

  // @Post("logout")
  // @SwaggerInfo({
  //   status: HttpStatus.NO_CONTENT,
  //   summary: "Log out as an authenticated user",
  //   successText: "User logged out successfully",
  //   type: null,
  // })
  // async logout() {
  //   await this.authService.logout();
  // }

  // @Post("apiKey")
  // @SwaggerInfo({
  //   status: HttpStatus.CREATED,
  //   summary: "Generate an API key",
  //   successText: "The API key was successfully generated",
  //   type: ApiKeyDto,
  // })
  // async createApiKey() {
  //   const apiKey = await this.authService.createApiKey();

  //   return { apiKey };
  // }
}
