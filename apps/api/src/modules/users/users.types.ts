import type { User } from "./entities/user.entity";

export type CreateUser = {
  firstName: string;
  lastName: string;
  username: string;
  hashedPassword: string;
};

export type UpdateUser = Partial<
  Pick<
    User,
    | "role"
    | "firstName"
    | "lastName"
    | "apiKeyLookupHash"
    | "apiKeySecret"
    | "password"
  >
>;
