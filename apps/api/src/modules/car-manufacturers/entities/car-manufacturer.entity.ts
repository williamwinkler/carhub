import { AbstractEntity } from "../../database/abstract.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  UpdateDateColumn,
} from "typeorm";
import { CarModel } from "../../car-models/entities/car-model.entity";

@Entity({ name: "car_manufacturers" })
export class CarManufacturer extends AbstractEntity {
  @Column({ unique: true })
  name!: string;

  @OneToMany(() => CarModel, (model) => model.manufacturer)
  models!: CarModel[];

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;
}
