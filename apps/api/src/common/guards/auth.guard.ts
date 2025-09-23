import { AuthService } from "@api/modules/auth/auth.service";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { Ctx } from "../ctx";
import { AppError } from "../errors/app-error";
import { Errors } from "../errors/errors";

const IS_PUBLIC_KEY = "isPublic";

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(
    private authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    const apiKey = this.extractApiKeyFromHeader(request);
    if (!token && !apiKey) {
      this.logger.debug("No credentials for user");
      throw new AppError(Errors.UNAUTHORIZED);
    }

    if (token) {
      const payload = await this.authService.verifyAccessToken(token);
      Ctx.principal = this.authService.principalFromJwt(payload);
      request.user = { ...payload, roles: [payload.role] };

      return true;
    }

    if (apiKey && this.authService.isApiKeyValid(apiKey)) {
      const user = await this.authService.findUserByApiKey(apiKey);
      Ctx.principal = this.authService.principalFromUser(user);
      request.user = { id: user.id, roles: [user.role] };

      return true;
    }

    throw new AppError(Errors.UNAUTHORIZED);
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];

    return type === "Bearer" ? token : undefined;
  }

  private extractApiKeyFromHeader(request: Request): string | undefined {
    const apiKey = request.headers["x-api-key"];
    if (Array.isArray(apiKey)) {
      return undefined;
    }

    return apiKey;
  }
}
