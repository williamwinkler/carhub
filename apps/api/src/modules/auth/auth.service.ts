import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "../config/config.service";
import { Role } from "../users/entities/user.entity";
import { UsersService } from "./../users/users.service";

export type Token = {
  iss: string;
  sub: string; // userId (JWT standard for Subject)
  firstName: string;
  lastName: string;
  role: Role;
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(
    username: string,
    pass: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }

    const payload: Token = {
      iss: "My API",
      sub: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.get("JWT_ACCESS_SECRET"),
        expiresIn: "7d",
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }
}
