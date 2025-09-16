import type { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { CarManufacturer } from "./src/modules/car-manufacturers/entities/car-manufacturer.entity";
import { CarModel } from "./src/modules/car-models/entities/car-model.entity";
import { Car } from "./src/modules/cars/entities/car.entity";
import { User } from "./src/modules/users/entities/user.entity";

/**
 * @fileoverview Shared database configuration for integration tests
 *
 * This module provides a centralized configuration for TypeORM in integration tests,
 * ensuring consistency across all test suites and making it easy to maintain
 * the entity list and database settings.
 *
 * @example
 * ```typescript
 * // In an integration test file:
 * import { TEST_DATABASE_CONFIG } from "@api/common/test/test-database.config";
 *
 * beforeAll(async () => {
 *   const module = await Test.createTestingModule({
 *     imports: [
 *       TypeOrmModule.forRoot(TEST_DATABASE_CONFIG),
 *       TypeOrmModule.forFeature([YourEntity]),
 *     ],
 *     providers: [YourService],
 *   }).compile();
 * });
 * ```
 */

/**
 * All entities used in the application.
 *
 * ⚠️ IMPORTANT: This array should be kept in sync with the main database configuration.
 * When adding new entities to the application, make sure to add them here as well.
 *
 * This centralized list ensures all integration tests have access to the same
 * entity definitions and prevents inconsistencies across test suites.
 */
export const TEST_ENTITIES = [User, Car, CarModel, CarManufacturer];

/**
 * Common TypeORM configuration for integration tests.
 * Uses PostgreSQL with a test database and enables synchronization.
 */
export const TEST_DATABASE_CONFIG: TypeOrmModuleOptions = {
  type: "postgres",
  host: "localhost",
  port: 5432,
  database: "demo_db",
  username: "admin",
  password: "admin",
  entities: TEST_ENTITIES,
  synchronize: true,
  dropSchema: false,
};

/**
 * Creates a TypeORM module configuration for integration tests.
 * This can be used directly in Test.createTestingModule imports.
 */
export function createTestDatabaseModule() {
  return {
    type: "postgres",
    host: "localhost",
    port: 5432,
    database: "demo_db",
    username: "admin",
    password: "admin",
    entities: TEST_ENTITIES,
    synchronize: true,
    dropSchema: false,
  };
}
