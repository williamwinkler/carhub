import type { UUID } from "crypto";

export const Role = {
  Admin: "admin",
  User: "user",
} as const;
export type RoleType = (typeof Role)[keyof typeof Role];

export class User {
  id!: UUID;

  role!: RoleType;

  firstName!: string;
  lastName!: string;

  username!: string;
  password!: string;

  apiKeyLookupHash?: string;
  apiKeySecret?: string;

  createdAt!: Date;
  updatedAt!: Date;
}
