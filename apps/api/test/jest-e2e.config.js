const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../tsconfig.json');

module.exports = {
  displayName: 'E2E',
  testMatch: ['<rootDir>/e2e/**/*.e2e-spec.ts'],
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
  coverageDirectory: '../coverage/e2e',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@api/(.*)$': '<rootDir>/../src/$1',
  },
  setupFilesAfterEnv: [
    '<rootDir>/../jest.setup.ts',
    '<rootDir>/helpers/database-setup.ts'
  ],
  maxWorkers: '25%', // Limited parallel execution for E2E tests
  testTimeout: 60000, // Long timeout for full app bootstrap
};
