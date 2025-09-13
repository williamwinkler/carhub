import { Ctx } from "@api/common/ctx";
import { BadRequestError } from "@api/common/errors/domain/bad-request.error";
import { UsernameAlreadyExistsError } from "@api/common/errors/domain/conflict.error";
import { UserNotFoundError } from "@api/common/errors/domain/not-found.error";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { UUID } from "crypto";
import { seedData } from "./entities/data";
import { User } from "./entities/user.entity";
import { CreateUser } from "./users.types";

@Injectable()
export class UsersService implements OnModuleInit {
  private users: User[] = [];

  private readonly logger = new Logger(UsersService.name);

  async onModuleInit() {
    await Promise.all(seedData.map((user) => this.create(user, true)));
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.users.find((user) => user.username === username) ?? null;
  }

  async findById(userId: UUID): Promise<User | null> {
    return this.users.find((u) => u.id === userId) ?? null;
  }

  // TODO: remove bypass when having a real db
  async create(options: CreateUser, bypass = false): Promise<User> {
    const { firstName, lastName, username, hashedPassword, role } = options;

    // Only admins can create admins
    if (!bypass && role === "admin" && Ctx.role !== "admin") {
      throw new BadRequestError("Only admins can set the role to 'admin'");
    }

    // Check if username already exists
    const existingUser = await this.findByUsername(username);
    if (existingUser) {
      throw new UsernameAlreadyExistsError();
    }

    const now = new Date();

    const newUser: User = {
      id: crypto.randomUUID() as UUID,
      firstName,
      lastName,
      username,
      password: hashedPassword,
      role,
      createdAt: now,
      updatedAt: now,
    };

    this.users.push(newUser);

    this.logger.log(
      `New user created with username ${newUser.username} and ID ${newUser.id}`,
    );

    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users];
  }

  async getByApiKeyLookupHash(apiKeyLookupHash: string): Promise<User | null> {
    const user = this.users.find(
      (user) => user.apiKeyLookupHash === apiKeyLookupHash,
    );

    return user ?? null;
  }

  async update(
    userId: UUID,
    data: Partial<Omit<User, "id" | "createdAt">>,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    const updatedUser: User = {
      ...user,
      ...data,
      updatedAt: new Date(),
    };

    this.users = this.users.map((u) => (u.id === user.id ? updatedUser : u));

    this.logger.log(`User ${user.id} was updated`);

    return updatedUser;
  }
}
