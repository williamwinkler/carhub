import { CarModel } from "@api/modules/car-models/entities/car-model.entity";
import { AbstractEntity } from "@api/modules/database/abstract.entity";
import { User } from "@api/modules/users/entities/user.entity";
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
  @JoinColumn({ name: "createdById" })
  createdBy!: User;

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
