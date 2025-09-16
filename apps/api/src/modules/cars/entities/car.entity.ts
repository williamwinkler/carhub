import { AbstractEntity } from "@api/modules/database/abstract.entity";
import { User } from "@api/modules/users/entities/user.entity";
import type { UUID } from "crypto";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  UpdateDateColumn,
} from "typeorm";
import { CarModel } from "../../car-models/entities/car-model.entity";

@Entity({ name: "cars" })
export class Car extends AbstractEntity {
  @ManyToOne(() => CarModel, (carModel) => carModel.cars, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  model!: CarModel;

  @Column()
  year!: number;

  @Column()
  color!: string;

  @Column()
  kmDriven!: number;

  @Column()
  price!: number;

  @ManyToOne(() => User, (user) => user.cars, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn()
  createdBy!: UUID;

  @ManyToMany(() => User, (user) => user.favorites, {
    onDelete: "CASCADE",
  })
  favoritedBy!: User[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @DeleteDateColumn({ type: "timestamptz" })
  deletedAt!: Date;
}
