const base = require("./jest.base.config");

module.exports = {
  ...base,
  displayName: "api-e2e",
  testMatch: ["<rootDir>/test/**/*.e2e-spec.ts"],
  maxWorkers: 1,
};
