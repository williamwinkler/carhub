import { Ctx } from "@api/common/ctx";
import { UsernameAlreadyExistsError } from "@api/common/errors/domain/conflict.error";
import { OnlyAdminsCanUpdateRolesError } from "@api/common/errors/domain/forbidden.error";
import { InternalServerError } from "@api/common/errors/domain/internal-server-error";
import { UserNotFoundError } from "@api/common/errors/domain/not-found.error";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
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
        throw new UsernameAlreadyExistsError();
      }

      this.logger.error(`Error saving new user`, error);
      throw new InternalServerError();
    }
  }

  async findById(id: UUID): Promise<User | null> {
    return await this.usersRepo.findOneBy({ id });
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
      throw new UserNotFoundError();
    }

    const principal = Ctx.principalRequired();

    if (data.role && principal.role !== "admin") {
      throw new OnlyAdminsCanUpdateRolesError();
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
      throw new UserNotFoundError();
    }

    await this.usersRepo.manager.transaction(async (manager) => {
      const carsRepo = manager.getRepository(Car);
      const usersRepo = manager.getRepository(User);

      // Soft delete all cars owned by the user
      if (user.cars.length > 0) {
        await carsRepo.softDelete({ createdBy: user.id });
      }

      // Soft delete the user
      await usersRepo.softDelete({ id: user.id });
    });

    this.logger.log(`User soft-deleted ${user.id}`);
  }
}
