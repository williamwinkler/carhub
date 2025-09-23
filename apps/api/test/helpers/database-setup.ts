import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';
import { DatabaseModule } from '@api/modules/database/database.module';
import { ConfigModule } from '@nestjs/config';

let dataSource: DataSource;
let testDatabaseName: string;

export const setupTestDatabase = async () => {
  // Create unique database name per worker
  const workerId = process.env.JEST_WORKER_ID || '1';
  testDatabaseName = `demo_test_db_w${workerId}_${Date.now()}`;

  // First create the test database
  const adminDataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USERNAME || 'admin',
    password: process.env.POSTGRES_PASSWORD || 'admin',
    database: 'postgres', // Connect to postgres to create new DB
  });

  await adminDataSource.initialize();
  await adminDataSource.query(`CREATE DATABASE "${testDatabaseName}"`);
  await adminDataSource.destroy();

  // Set up test environment variables
  process.env.POSTGRES_DATABASE = testDatabaseName;
  process.env.NODE_ENV = 'test';

  return testDatabaseName;
};

export const getTestDataSource = async () => {
  if (!dataSource) {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.test',
          isGlobal: true,
        }),
        DatabaseModule,
      ],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
  }
  return dataSource;
};

export const cleanupTestDatabase = async () => {
  if (dataSource) {
    await dataSource.destroy();
  }

  if (testDatabaseName) {
    const adminDataSource = new DataSource({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      username: process.env.POSTGRES_USERNAME || 'admin',
      password: process.env.POSTGRES_PASSWORD || 'admin',
      database: 'postgres',
    });

    await adminDataSource.initialize();
    await adminDataSource.query(`DROP DATABASE IF EXISTS "${testDatabaseName}"`);
    await adminDataSource.destroy();
  }
};

// Transaction management for tests
let queryRunner: any;

export const beginTransaction = async () => {
  const ds = await getTestDataSource();
  queryRunner = ds.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  return queryRunner;
};

export const rollbackTransaction = async () => {
  if (queryRunner) {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
    queryRunner = null;
  }
};

// Global setup/teardown hooks
beforeAll(async () => {
  await setupTestDatabase();
}, 30000);

afterAll(async () => {
  await cleanupTestDatabase();
}, 30000);

beforeEach(async () => {
  await beginTransaction();
});

afterEach(async () => {
  await rollbackTransaction();
});