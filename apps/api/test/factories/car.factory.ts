import { randomUUID } from 'crypto';
import type { UUID } from 'crypto';
import type { Car } from '@api/modules/cars/entities/car.entity';
import type { CarModel } from '@api/modules/car-models/entities/car-model.entity';

export interface CarFactoryOptions {
  id?: UUID;
  model?: CarModel;
  year?: number;
  color?: string;
  kmDriven?: number;
  price?: number;
  ownerId?: UUID;
  createdBy?: UUID;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createCarFactory = (options: CarFactoryOptions = {}): Partial<Car> => {
  const id = options.id || randomUUID();
  const ownerId = options.ownerId || randomUUID();

  return {
    id,
    model: options.model || {
      id: randomUUID(),
      name: 'Camry',
      manufacturer: {
        id: randomUUID(),
        name: 'Toyota',
      },
    } as CarModel,
    year: options.year || 2023,
    color: options.color || 'Blue',
    kmDriven: options.kmDriven || 5000,
    price: options.price || 25000,
    createdBy: options.createdBy || ownerId,
    favoritedBy: [],
    createdAt: options.createdAt || new Date(),
    updatedAt: options.updatedAt || new Date(),
  };
};

export const createLuxuryCarFactory = (options: CarFactoryOptions = {}): Partial<Car> => {
  return createCarFactory({
    ...options,
    model: options.model || {
      id: randomUUID(),
      name: 'M3',
      manufacturer: {
        id: randomUUID(),
        name: 'BMW',
      },
    } as CarModel,
    year: options.year || 2024,
    price: options.price || 75000,
  });
};