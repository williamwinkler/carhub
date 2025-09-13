import { Injectable } from "@nestjs/common";
import { UUID } from "crypto";
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
      apiKey: "",
    },
    {
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      role: "admin",
      firstName: "Admin",
      lastName: "User",
      username: "admin",
      password: "admin123",
      apiKey: "admin-api-key",
    },
    {
      id: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      role: "user",
      firstName: "Jane",
      lastName: "Smith",
      username: "jane",
      password: "jane123",
      apiKey: "jane-api-key",
    },
  ];

  async findOne(username: string): Promise<User | null> {
    return this.users.find((user) => user.username === username) ?? null;
  }

  async findById(id: UUID): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async findByApiKey(apiKey: string): Promise<User | null> {
    return this.users.find((u) => u.apiKey === apiKey) ?? null;
  }
}
