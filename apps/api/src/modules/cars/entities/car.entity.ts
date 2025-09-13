import type { UUID } from "crypto";

export const CarBrand = {
  BMW: "BMW",
  Mercedes: "Mercedes",
  Porsche: "Porsche",
  Audi: "Audi",
  Toyota: "Toyota",
  Honda: "Honda",
  Ford: "Ford",
  Tesla: "Tesla",
  Volkswagen: "Volkswagen",
} as const;

export type CarBrandType = (typeof CarBrand)[keyof typeof CarBrand];

export class Car {
  id!: UUID;
  brand!: CarBrandType;
  model!: string;
  year!: number;
  color!: string;
  kmDriven!: number;
  price!: number;

  createdBy!: UUID;
  createdAt!: Date;
  updatedBy?: UUID;
  updatedAt?: Date;

  favoritedBy!: UUID[];
}
