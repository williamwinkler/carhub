import { Ctx, Principal } from "@api/common/ctx";
import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import { hash } from "@api/common/utils/common.utils";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import type { Cache } from "cache-manager";
import { randomBytes, UUID } from "crypto";
import ms from "ms";
import { ConfigService } from "../config/config.service";
import { RoleType, User } from "../users/entities/user.entity";
import { UsersService } from "./../users/users.service";
import { JwtDto } from "./dto/jwt.dto";
import { RegisterDto } from "./dto/register.dto";

export type TokenPayload = {
  iss: string;
  sub: UUID; // userId (JWT standard for Subject)
  sid: UUID;
  firstName: string;
  lastName: string;
  role: RoleType;
};

type RefreshPayload = Pick<TokenPayload, "sub" | "sid">;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 12;
  private readonly refreshTTL = ms("7d");
  private readonly apiKeyPrefix = "ak"; // (a)pi (k)ey
  private readonly apiKeyEnv: "test" | "live";
  private readonly apiKeyRandomPartLength = 32;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.apiKeyEnv =
      this.configService.get("NODE_ENV") === "production" ? "live" : "test";
  }

  async verifyAccessToken(accessToken: string): Promise<TokenPayload> {
    try {
      return await this.jwtService.verifyAsync(accessToken);
    } catch {
      this.logger.debug("Invalid access token");
      throw new AppError(Errors.UNAUTHORIZED);
    }
  }

  async findUserByApiKey(apiKey: string): Promise<User> {
    const apiKeyLookupHash = hash(apiKey);

    const cacheKey = `user:apikey:${apiKeyLookupHash}`;
    const cachedUser = await this.cacheManager.get<User>(cacheKey);
    if (cachedUser) {
      return cachedUser;
    }

    // Find user by API key lookup hash
    const foundUser =
      await this.usersService.findByApiKeyLookupHash(apiKeyLookupHash);

    // Verify user exists and the apiKey is valid
    if (
      !foundUser?.apiKeySecret ||
      (await bcrypt.compare(foundUser.apiKeySecret, apiKey))
    ) {
      throw new AppError(Errors.UNAUTHORIZED);
    }

    // Cache user for 24 hours with deterministic hash as cache key
    await this.cacheManager.set(cacheKey, foundUser, ms("24h"));
    this.logger.debug("User cached for API key");

    return foundUser;
  }

  async register(dto: RegisterDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(dto.password, this.saltRounds);

    return this.usersService.create({ ...dto, hashedPassword });
  }

  async createApiKey(): Promise<string> {
    const userId = Ctx.userIdRequired();
    const user = await this.usersService.findById(userId, ["apiKeyLookupHash"]);

    const randomString = randomBytes(this.apiKeyRandomPartLength).toString(
      "hex",
    );

    const apiKey = `${this.apiKeyPrefix}_${this.apiKeyEnv}_${randomString}`;

    const apiKeyLookupHash = hash(apiKey);
    const apiKeySecret = await bcrypt.hash(apiKey, this.saltRounds);

    // Update the user with the new API key
    await this.usersService.update(userId, {
      apiKeyLookupHash,
      apiKeySecret,
    });

    // Delete user cache based on previous API key
    if (user?.apiKeyLookupHash) {
      await this.cacheManager.del(`user:apikey:${user.apiKeyLookupHash}`);
    }

    this.logger.log(`Created API key for user ${userId}`);

    return apiKey;
  }

  async login(username: string, pass: string): Promise<JwtDto> {
    const user = await this.usersService.findByUsername(username);

    if (!user?.password || !(await bcrypt.compare(pass, user.password))) {
      throw new AppError(Errors.INVALID_CREDENTIALS);
    }

    const tokens = await this.getTokens(user);

    this.logger.log(`User logged in: ${user.id}`);

    return tokens;
  }

  async logout(): Promise<void> {
    const sub = Ctx.userId;
    const sid = Ctx.sessionId;

    if (!sub || !sid) {
      throw new AppError(Errors.UNAUTHORIZED);
    }

    await this.cacheManager.del(`refresh_tokens:${sub}:${sid}`);
    this.logger.log(`User ${sub} logged out of session ${sid}`);
  }

  private async getTokens(user: User): Promise<JwtDto> {
    const sessionId = crypto.randomUUID() as UUID;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(this.getTokenPayload(user, sessionId)),
      this.jwtService.signAsync(
        { sub: user.id, sid: sessionId },
        {
          secret: this.configService.get("JWT_REFRESH_SECRET"),
          expiresIn: this.refreshTTL,
        },
      ),
    ]);

    await this.cacheManager.set(
      `refresh_tokens:${user.id}:${sessionId}`,
      refreshToken,
      this.refreshTTL,
    );

    return { accessToken, refreshToken };
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
      throw new AppError(Errors.INVALID_REFRESH_TOKEN); // revoked or expired
    }

    // 3. Ensure the user exists
    const user = await this.usersService.findById(sub);
    if (!user) {
      throw new AppError(Errors.INVALID_REFRESH_TOKEN);
    }

    const [tokens] = await Promise.all([
      this.getTokens(user),
      this.cacheManager.del(`refresh_tokens:${user.id}:${sid}`), // Delete old refresh token
    ]);

    this.logger.log(`User ${sub} renewed their session`);

    return tokens;
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

  isApiKeyValid(apiKey: string): boolean {
    const parts = apiKey.split("_");

    if (
      parts.length !== 3 ||
      parts[0] !== this.apiKeyPrefix ||
      parts[1] !== this.apiKeyEnv ||
      parts[2].length !== this.apiKeyRandomPartLength * 2
    ) {
      this.logger.debug("Invalid API key");

      return false;
    }

    return true;
  }
}
