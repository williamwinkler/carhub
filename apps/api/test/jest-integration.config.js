const base = require("./jest.base.config");

module.exports = {
  ...base,
  displayName: "api-integration",
  testMatch: [
    "<rootDir>/test/**/*.trpc.spec.ts",
    "<rootDir>/test/**/*.integration-spec.ts",
  ],
  maxWorkers: 1,
};
