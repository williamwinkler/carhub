import type { UUID } from "crypto";

export class User {
  id!: UUID;

  role!: Role;

  firstName!: string;
  lastName!: string;

  username?: string;
  password?: string;

  apiKey?: string;
}

export const roles = ["admin", "user"] as const;
export type Role = (typeof roles)[number];
