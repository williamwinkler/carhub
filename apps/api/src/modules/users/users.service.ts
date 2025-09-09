import { Injectable } from "@nestjs/common";
import { randomUUID, UUID } from "crypto";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersService {
  private readonly users: User[] = [
    {
      id: "59fc50ac-30b0-4852-a963-3aa04cdf25d0",
      role: "user",
      firstName: "William",
      lastName: "Winkler",
      username: "string",
      password: "string",
      apiKey: ""
    },
  ];

  async findOne(username: string): Promise<User | null> {
    return this.users.find((user) => user.username === username) ?? null;
  }

  async findById(id: UUID): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async findByApiKey(apiKey: string): Promise<User | null> {
    return this.users.find(u => u.apiKey === apiKey) ?? null;
  }
}
