import { Ctx } from "@api/common/ctx";
import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Cache } from "cache-manager";
import { UUID } from "crypto";
import { QueryFailedError, Repository } from "typeorm";
import { Car } from "../cars/entities/car.entity";
import { User } from "./entities/user.entity";
import { CreateUser, UpdateUser } from "./users.types";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(options: CreateUser): Promise<User> {
    const { firstName, lastName, username, hashedPassword } = options;

    try {
      const newUser = this.usersRepo.create({
        firstName,
        lastName,
        username,
        password: hashedPassword,
        role: "user",
        apiKeyLookupHash: null,
        apiKeySecret: null,
      });

      const savedUser = await this.usersRepo.save(newUser);

      this.logger.log(
        `New user created with username ${savedUser.username} and ID ${savedUser.id}`,
      );

      return savedUser;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError?.code === "23505"
      ) {
        this.logger.debug(
          `Uniqueness constraint: username "${username}" already exists`,
        );
        throw new AppError(Errors.USERNAME_ALREADY_EXISTS);
      }

      this.logger.error(`Error saving new user`, error);
      throw new AppError(Errors.UNEXPECTED_ERROR);
    }
  }

  async findById(id: UUID): Promise<User | null>;
  async findById<K extends (keyof User)[]>(
    id: UUID,
    select?: K,
  ): Promise<Pick<User, K[number]> | null>;
  async findById(id: UUID, select?: (keyof User)[]): Promise<User | null> {
    return await this.usersRepo.findOne({
      where: { id },
      select,
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.usersRepo.findOneBy({ username });
  }

  async findByApiKeyLookupHash(apiKeyLookupHash: string): Promise<User | null> {
    return await this.usersRepo.findOneBy({ apiKeyLookupHash });
  }

  async update(id: UUID, data: UpdateUser): Promise<User> {
    const existingUser = await this.usersRepo.findOne({
      where: { id },
    });

    if (!existingUser) {
      throw new AppError(Errors.USER_NOT_FOUND);
    }

    const principal = Ctx.principalRequired();

    if (data.role && principal.role !== "admin") {
      throw new AppError(Errors.ONLY_ADMINS_CAN_UPDATE_ROLES);
    }

    const updatedUser = this.usersRepo.create({ ...existingUser, ...data });
    const savedUser = await this.usersRepo.save(updatedUser);
    this.logger.log(`User ${savedUser.id} updated by ${principal.id}`);

    return savedUser;
  }

  async softDelete(id: UUID): Promise<void> {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: { cars: true },
    });

    if (!user) {
      throw new AppError(Errors.USER_NOT_FOUND);
    }

    await this.usersRepo.manager.transaction(async (manager) => {
      const carsRepo = manager.getRepository(Car);
      const usersRepo = manager.getRepository(User);

      // Soft delete all cars owned by the user
      if (user.cars.length > 0) {
        await carsRepo.softDelete({ createdBy: { id: user.id } });
      }

      // Remove from cache
      if (user.apiKeyLookupHash) {
        await this.cacheManager.del(`user:apikey:${user.apiKeyLookupHash}`);
      }

      // Soft delete the user
      await usersRepo.softDelete({ id: user.id });
    });

    this.logger.log(`User soft-deleted ${user.id}`);
  }
}
