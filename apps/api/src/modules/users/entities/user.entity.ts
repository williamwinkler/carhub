import { Car } from "@api/modules/cars/entities/car.entity";
import { AbstractEntity } from "@api/modules/database/abstract.entity";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  UpdateDateColumn,
} from "typeorm";

export const Role = {
  Admin: "admin",
  User: "user",
} as const;
export type RoleType = (typeof Role)[keyof typeof Role];

@Entity({ name: "users" })
export class User extends AbstractEntity {
  @Column({
    type: "enum",
    enum: Role,
  })
  role: RoleType;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true, unique: true })
  apiKeyLookupHash?: string;

  @Column({ nullable: true })
  apiKeySecret?: string;

  @OneToMany(() => Car, (car) => car.createdBy)
  cars!: Car[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @DeleteDateColumn({ type: "timestamptz" })
  deletedAt?: Date;
}
