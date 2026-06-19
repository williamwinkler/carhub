import { CarsService } from "@api/modules/cars/cars.service";
import type { Car } from "@api/modules/cars/entities/car.entity";
import type { User } from "@api/modules/users/entities/user.entity";
import type { UUID } from "crypto";
import type { Repository } from "typeorm";

describe("CarsService.toggleFavoriteForUser", () => {
  const carId = "550e8400-e29b-41d4-a716-446655440000" as UUID;
  const userId = "550e8400-e29b-41d4-a716-446655440001" as UUID;
  const userRef = { id: userId } as unknown as User;

  function createService(car: Pick<Car, "id" | "favoritedBy">) {
    const carsRepo: Partial<jest.Mocked<Repository<Car>>> = {
      findOne: jest.fn().mockResolvedValue(car),
      save: jest.fn().mockResolvedValue(car as Car),
    };

    return {
      service: new CarsService(carsRepo as Repository<Car>, {} as never),
      carsRepo,
    };
  }

  it("returns true after adding the user favorite", async () => {
    const car: Pick<Car, "id" | "favoritedBy"> = {
      id: carId,
      favoritedBy: [],
    };
    const { service, carsRepo } = createService(car);

    await expect(service.toggleFavoriteForUser(carId, userId)).resolves.toBe(
      true,
    );

    expect(car.favoritedBy).toEqual([{ id: userId }]);
    expect(carsRepo.save).toHaveBeenCalledWith(car);
  });

  it("returns false after removing the user favorite", async () => {
    const car: Pick<Car, "id" | "favoritedBy"> = {
      id: carId,
      favoritedBy: [userRef],
    };
    const { service, carsRepo } = createService(car);

    await expect(service.toggleFavoriteForUser(carId, userId)).resolves.toBe(
      false,
    );

    expect(car.favoritedBy).toEqual([]);
    expect(carsRepo.save).toHaveBeenCalledWith(car);
  });
});
