import { randomUUID } from 'crypto';
import type { User } from '@api/modules/users/entities/user.entity';
import type { RoleType } from '@api/modules/users/entities/user.entity';

export interface UserFactoryOptions {
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: RoleType;
  password?: string;
  apiKeyLookupHash?: string | null;
  apiKeySecret?: string | null;
}

export const createUserFactory = (options: UserFactoryOptions = {}): Partial<User> => {
  const id = options.id || randomUUID();
  const username = options.username || `user_${id.slice(0, 8)}`;

  return {
    id,
    username,
    firstName: options.firstName || 'Test',
    lastName: options.lastName || 'User',
    role: options.role || 'user',
    password: options.password || 'hashedPassword123',
    apiKeyLookupHash: options.apiKeyLookupHash || null,
    apiKeySecret: options.apiKeySecret || null,
    cars: [],
    favorites: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const createAdminUserFactory = (options: UserFactoryOptions = {}): Partial<User> => {
  return createUserFactory({
    ...options,
    role: 'admin',
    username: options.username || `admin_${(options.id || randomUUID()).slice(0, 8)}`,
  });
};