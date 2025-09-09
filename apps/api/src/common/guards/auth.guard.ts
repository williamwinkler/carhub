import { TokenPayload } from "@api/modules/auth/auth.service";
import { ConfigService } from "@api/modules/config/config.service";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { Ctx } from "../ctx";
import { UnauthorizedError } from "../errors/domain/unauthorized.error";

const IS_PUBLIC_KEY = "isPublic";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private configService: ConfigService,
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
    if (!token) {
      throw new UnauthorizedError();
    }
    try {
      const payload: TokenPayload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get("JWT_ACCESS_SECRET"),
      });
      request["user"] = { ...payload, roles: [payload.role] }; // Attach to req.user; roles as array for RolesGuard
      Ctx.token = payload; // Set in CLS context
    } catch {
      throw new UnauthorizedError();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
