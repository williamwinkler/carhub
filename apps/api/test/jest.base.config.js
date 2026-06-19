const path = require("path");

module.exports = {
  rootDir: "..",
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: path.join(__dirname, "tsconfig.json"),
      },
    ],
  },
  moduleFileExtensions: ["ts", "js", "json"],
  moduleNameMapper: {
    "^@api/(.*)$": "<rootDir>/src/$1",
    "^@repo/logging$": "<rootDir>/../../packages/logging/src/index.ts",
    "^github-slugger$": "<rootDir>/test/mocks/github-slugger.ts",
  },
  setupFiles: ["<rootDir>/test/setup/env.ts"],
  setupFilesAfterEnv: ["<rootDir>/test/setup/jest.ts"],
  testPathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  clearMocks: true,
};
