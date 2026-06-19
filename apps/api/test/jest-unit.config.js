const base = require("./jest.base.config");

module.exports = {
  ...base,
  displayName: "api-unit",
  testMatch: ["<rootDir>/test/**/*.unit-spec.ts"],
};
