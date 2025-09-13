import { Injectable } from "@nestjs/common";
import { UserDto } from "./dto/user.dto";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersAdapter {
  getUserDto(user: User): UserDto {
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role,
      hasApiKey: !!user.apiKeySecret,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
