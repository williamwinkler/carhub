import { config } from "dotenv";
import { DataSource } from "typeorm";

// Load environment variables
config({ path: '.env.local', quiet: true });

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  database: process.env.POSTGRES_DATABASE || "trpc_demo",
  username: process.env.POSTGRES_USERNAME || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",

  // Entity configuration - use glob patterns for CLI compatibility
  entities: ["src/modules/**/entities/*.entity.ts"],

  // Migration configuration
  migrations: ["migrations/*.ts"],
  migrationsTableName: "migrations",

  // Synchronize should be false in production
  synchronize: false,

  // Enable logging for development
  logging: process.env.NODE_ENV === "development",

  // SSL configuration for production
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});
