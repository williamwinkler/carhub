const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../tsconfig.json');

module.exports = {
  displayName: 'INTEGRATION',
  testMatch: ['<rootDir>/integration/**/*.spec.ts'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../tsconfig.test.json',
      },
    ],
  },
  collectCoverageFrom: [
    '../src/**/*.(t|j)s',
    '!../src/**/*.spec.ts',
    '!../src/**/*.integration.spec.ts',
    '!../src/**/*.e2e-spec.ts',
    '!../src/main.ts',
  ],
  coverageDirectory: '../coverage/integration',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@api/(.*)$': '<rootDir>/../src/$1',
  },
  setupFilesAfterEnv: [
    '<rootDir>/../jest.setup.ts',
    '<rootDir>/helpers/database-setup.ts'
  ],
  maxWorkers: '50%', // Parallel execution with per-worker database isolation
  testTimeout: 30000, // Longer timeout for DB operations
};
