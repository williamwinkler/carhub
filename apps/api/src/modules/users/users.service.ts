import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { User } from "./entities/user.entity";

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

  async findOne(username: string): Promise<User | null> {
    return this.users.find((user) => user.username === username) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }
}
