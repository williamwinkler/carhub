import type { UUID } from "crypto";

export enum CarBrand {
  BMW = "BMW",
  Mercedes = "Mercedes",
  Porsche = "Porsche",
  Audi = "Audi",
  Toyota = "Toyota",
  Honda = "Honda",
  Ford = "Ford",
  Tesla = "Tesla",
  Volkswagen = "Volkswagen",
}

export class Car {
  id: UUID;
  brand: CarBrand;
  model: string;
  year: number;
  color: string;
  kmDriven: number;
  price: number;
}
