import { InvalidCredentialsError } from "@api/common/errors/domain/bad-request.error";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Cache } from "cache-manager";
import { ConfigService } from "../config/config.service";
import { Role, User } from "../users/entities/user.entity";
import { UsersService } from "./../users/users.service";
import { JwtDto } from "./dto/jwt.dto";

export type TokenPayload = {
  iss: string;
  sub: string; // userId (JWT standard for Subject)
  sid: string;
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

  async refreshTokens(refreshToken: string): Promise<JwtDto> {
    try {
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
        throw new InvalidCredentialsError(); // revoked or expired
      }

      // 3. Ensure the user exists
      const user = await this.usersService.findById(sub);
      if (!user) {
        throw new InvalidCredentialsError();
      }

      const tokens = await this.getTokens(user, sid);

      this.logger.log(`User ${sub} renewed their session`);

      return tokens;
    } catch (error) {
      this.logger.log(`An error occured when refreshing tokens. ${error}`)
      throw new InvalidCredentialsError();
    }
  }

  async logout(refreshToken: string): Promise<void> {
    // TODO: get this from the ctx instead
    const { sub, sid } = await this.jwtService.verifyAsync<RefreshPayload>(
      refreshToken,
      {
        secret: this.configService.get("JWT_REFRESH_SECRET"),
      },
    );

    await this.cacheManager.del(`refresh_tokens:${sub}:${sid}`);

    this.logger.log(`User ${sub} logged out of session ${sid}`);
  }

  private async getTokens(user: User, oldSid?: string): Promise<JwtDto> {
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

    if (oldSid) {
      await this.cacheManager.del(`refresh_tokens:${user.id}:${oldSid}`);
      this.logger.debug(`Deleted old refresh token for ${user.id} session ${oldSid}`)
    }

    return { accessToken, refreshToken };
  }

  private getTokenPayload(user: User, sessionId: string): TokenPayload {
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
