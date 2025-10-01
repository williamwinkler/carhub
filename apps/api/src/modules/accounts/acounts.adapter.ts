import { Injectable } from "@nestjs/common";
import { User } from "../users/entities/user.entity";
import { AccountDto } from "./dto/account.dto";

@Injectable()
export class AccountsAdapter {
  getDto(user: User): AccountDto {
    return {
      id: user.id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      hasApiKey: !!user.apiKeySecret,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
