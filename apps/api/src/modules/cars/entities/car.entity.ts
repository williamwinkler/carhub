import type { CarBrandType } from "@repo/shared";
import type { UUID } from "crypto";

export class Car {
  id: UUID;
  brand: CarBrandType;
  model: string;
  year: number;
  color: string;
  kmDriven: number;
  price: number;
  
  createdBy: UUID;
  createdAt: Date;
  updatedBy?: UUID;
  updatedAt?: Date;
  
  favoritedBy: UUID[];
}
