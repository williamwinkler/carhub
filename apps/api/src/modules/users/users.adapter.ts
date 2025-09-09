import { Injectable } from "@nestjs/common";
import { MeDto } from "./dto/me.dto";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersAdapter {
  getMeDto(user: User): MeDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }
}
