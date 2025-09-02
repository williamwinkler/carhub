import { Injectable } from "@nestjs/common";
import { User } from "./entities/user.entity";
import { randomUUID } from "crypto";

@Injectable()
export class UsersService {
  private readonly users: User[] = [
    {
      id: randomUUID(),
      role: "admin",
      firstName: "William",
      lastName: "Winkler",
      username: "ww",
      password: "password",
    },
  ];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username);
  }
}
