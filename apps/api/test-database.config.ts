import type { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { config } from "dotenv";
import type { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { CarManufacturer } from "./src/modules/car-manufacturers/entities/car-manufacturer.entity";
import { CarModel } from "./src/modules/car-models/entities/car-model.entity";
import { Car } from "./src/modules/cars/entities/car.entity";
import { User } from "./src/modules/users/entities/user.entity";

// Load environment variables for tests
config();

/**
 * @fileoverview Environment-based database configuration for integration tests
 *
 * This module provides a centralized configuration for TypeORM in integration tests,
 * using environment variables for database connection settings. This allows for
 * different test database configurations across environments.
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
 *
 * @example
 * ```bash
 * # Environment variables for test database (optional, falls back to main DB config)
 * TEST_POSTGRES_HOST=localhost
 * TEST_POSTGRES_PORT=5433
 * TEST_POSTGRES_DATABASE=demo_test_db
 * TEST_POSTGRES_USERNAME=test_user
 * TEST_POSTGRES_PASSWORD=test_password
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
 * Get database configuration from environment variables.
 * Falls back to main database config if test-specific variables are not set.
 */
function getTestDatabaseConfig(): PostgresConnectionOptions {
  return {
    type: "postgres",
    host:
      process.env.TEST_POSTGRES_HOST ??
      process.env.POSTGRES_HOST ??
      "localhost",
    port: parseInt(
      process.env.TEST_POSTGRES_PORT ?? process.env.POSTGRES_PORT ?? "5432",
    ),
    database:
      process.env.TEST_POSTGRES_DATABASE ??
      process.env.POSTGRES_DATABASE ??
      "demo_db",
    username:
      process.env.TEST_POSTGRES_USERNAME ??
      process.env.POSTGRES_USERNAME ??
      "admin",
    password:
      process.env.TEST_POSTGRES_PASSWORD ??
      process.env.POSTGRES_PASSWORD ??
      "admin",
    entities: TEST_ENTITIES,
    synchronize: true, // Always sync in tests for clean state
    dropSchema: process.env.TEST_DROP_SCHEMA === "true" ?? false,
    logging: process.env.NODE_ENV === "development" ? ["error"] : false,
    // Disable SSL for local test databases
    ssl: false,
  };
}

/**
 * Complete TypeORM configuration for integration tests.
 * Uses environment variables for database connection with sensible fallbacks.
 */
export const TEST_DATABASE_CONFIG: TypeOrmModuleOptions =
  getTestDatabaseConfig();

/**
 * Creates a TypeORM module configuration for integration tests.
 * This can be used directly in Test.createTestingModule imports.
 *
 * @deprecated Use TEST_DATABASE_CONFIG directly instead
 */
export function createTestDatabaseModule() {
  return TEST_DATABASE_CONFIG;
}
