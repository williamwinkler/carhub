import { AuthService } from "@api/modules/auth/auth.service";
import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { Ctx } from "../ctx";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { AppError } from "../errors/app-error";
import { Errors } from "../errors/errors";

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(
    @Inject(AuthService) private authService: AuthService,
    @Inject(Reflector) private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKeyFromHeader(request);
    if (!apiKey) {
      this.logger.debug("No API key for controller request");
      throw new AppError(Errors.UNAUTHORIZED);
    }

    if (!this.authService.isApiKeyValid(apiKey)) {
      this.logger.debug("Invalid API key format");
      throw new AppError(Errors.UNAUTHORIZED);
    }

    const user = await this.authService.findUserByApiKey(apiKey);
    Ctx.principal = this.authService.principalFromUser(user);
    const authenticatedRequest = request as Request & {
      user: { id: string; roles: string[] };
    };
    authenticatedRequest.user = { id: user.id, roles: [user.role] };

    return true;
  }

  private extractApiKeyFromHeader(request: Request): string | undefined {
    const apiKey = request.headers["x-api-key"];
    if (Array.isArray(apiKey)) {
      return undefined;
    }

    return apiKey;
  }
}
