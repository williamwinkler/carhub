import { Ctx, Principal } from "@api/common/ctx";
import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from "@api/common/errors/domain/bad-request.error";
import { UnauthorizedError } from "@api/common/errors/domain/unauthorized.error";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Cache } from "cache-manager";
import { UUID } from "crypto";
import { ConfigService } from "../config/config.service";
import { Role, User } from "../users/entities/user.entity";
import { UsersService } from "./../users/users.service";
import { JwtDto } from "./dto/jwt.dto";

export type TokenPayload = {
  iss: string;
  sub: UUID; // userId (JWT standard for Subject)
  sid: UUID;
  firstName: string;
  lastName: string;
  role: Role;
};

type RefreshPayload = Pick<TokenPayload, "sub" | "sid">;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async verifyAccessToken(accessToken: string): Promise<TokenPayload> {
    try {
      return this.jwtService.verifyAsync(accessToken);
    } catch {
      this.logger.debug("Invalid access token");
      throw new UnauthorizedError();
    }
  }

  async findUserByApiKey(apiKey: string): Promise<User> {
    const user = await this.usersService.findByApiKey(apiKey);
    if (!user) throw new UnauthorizedError();
    return user;
  }

  async login(username: string, pass: string): Promise<JwtDto> {
    const user = await this.usersService.findOne(username);

    // TODO: improve with hashing (it's just a demo app)
    if (user?.password !== pass) {
      throw new InvalidCredentialsError();
    }

    const tokens = await this.getTokens(user);

    this.logger.log(`User logged in: ${user.id}`);

    return tokens;
  }

  principalFromJwt(payload: TokenPayload): Principal {
    return {
      id: payload.sub,
      role: payload.role,
      sessionId: payload.sid,
      authType: "jwt",
    };
  }

  principalFromUser(user: User): Principal {
    return {
      id: user.id,
      role: user.role,
      authType: "api-key",
    };
  }

  async refreshTokens(refreshToken: string): Promise<JwtDto> {
    // 1. Verify refresh token validity & signature
    const { sub, sid } = await this.jwtService.verifyAsync<RefreshPayload>(
      refreshToken,
      {
        secret: this.configService.get("JWT_REFRESH_SECRET"),
      },
    );

    // 2. Check cache that the refresh token is still active
    const cachedToken = await this.cacheManager.get<string>(
      `refresh_tokens:${sub}:${sid}`,
    );

    if (!cachedToken || cachedToken !== refreshToken) {
      throw new InvalidRefreshTokenError(); // revoked or expired
    }

    // 3. Ensure the user exists
    const user = await this.usersService.findById(sub);
    if (!user) {
      throw new InvalidRefreshTokenError();
    }

    const [tokens] = await Promise.all([
      this.getTokens(user),
      this.cacheManager.del(`refresh_tokens:${user.id}:${sid}`), // Delete old refresh token
    ]);

    this.logger.log(`User ${sub} renewed their session`);

    return tokens;
  }

  async logout(): Promise<void> {
    const sub = Ctx.userId;
    const sid = Ctx.sessionId;

    if (!sub || !sid) throw new UnauthorizedError();

    await this.cacheManager.del(`refresh_tokens:${sub}:${sid}`);
    this.logger.log(`User ${sub} logged out of session ${sid}`);
  }

  private async getTokens(user: User): Promise<JwtDto> {
    const sessionId = crypto.randomUUID();
    const refreshTTL = 1000 * 60 * 60 * 24 * 7; // 7 days in milliseconds

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(this.getTokenPayload(user, sessionId)),
      this.jwtService.signAsync(
        { sub: user.id, sid: sessionId },
        {
          secret: this.configService.get("JWT_REFRESH_SECRET"),
          expiresIn: refreshTTL,
        },
      ),
    ]);

    await this.cacheManager.set(
      `refresh_tokens:${user.id}:${sessionId}`,
      refreshToken,
      refreshTTL,
    );

    return { accessToken, refreshToken };
  }

  private getTokenPayload(user: User, sessionId: UUID): TokenPayload {
    return {
      iss: "Demo Nestjs API",
      sub: user.id,
      sid: sessionId,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }
}
