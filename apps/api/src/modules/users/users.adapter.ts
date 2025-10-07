import { Injectable } from "@nestjs/common";
import { UserDto } from "./dto/user.dto";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersAdapter {
  getCreatedBy(user: User): UserDto {
    return {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
