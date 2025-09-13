import type { RoleType } from "./entities/user.entity";

export type CreateUser = {
  firstName: string;
  lastName: string;
  username: string;
  hashedPassword: string;
  role: RoleType;
};
