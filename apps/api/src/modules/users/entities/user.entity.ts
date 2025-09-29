import { Car } from "@api/modules/cars/entities/car.entity";
import { AbstractEntity } from "@api/modules/database/abstract.entity";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  Unique,
  UpdateDateColumn,
} from "typeorm";

export const Role = {
  Admin: "admin",
  User: "user",
} as const;
export type RoleType = (typeof Role)[keyof typeof Role];

@Entity({ name: "users" })
@Unique("users_username_unique", ["username"])
export class User extends AbstractEntity {
  @Column({
    type: "enum",
    enum: Role,
  })
  role!: RoleType;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column()
  username!: string;

  @Column()
  password!: string;

  @Column({ type: "text", nullable: true, unique: true })
  apiKeyLookupHash!: string | null;

  @Column({ type: "text", nullable: true })
  apiKeySecret!: string | null;

  @OneToMany(() => Car, (car) => car.createdBy)
  cars!: Car[];

  @ManyToMany(() => Car, (car) => car.favoritedBy, {
    cascade: true,
  })
  @JoinTable({
    name: "user_favorite_cars",
    joinColumn: { name: "user_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "car_id", referencedColumnName: "id" },
  })
  favorites!: Car[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @DeleteDateColumn({ type: "timestamptz" })
  deletedAt?: Date;
}
