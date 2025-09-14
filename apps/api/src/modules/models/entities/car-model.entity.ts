import { AbstractEntity } from "@api/modules/database/abstract.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
} from "typeorm";
import { CarManufacturer } from "../../manufacturers/entities/car-manufacturer.entity";
import { Car } from "../../cars/entities/car.entity";

@Entity({ name: "car_models" })
export class CarModel extends AbstractEntity {
  @Column({ unique: true })
  name!: string;

  @ManyToOne(() => CarManufacturer, (manufacturer) => manufacturer.models, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  manufacturer!: CarManufacturer;

  @OneToMany(() => Car, (car) => car.model)
  cars!: Car[];

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;
}
