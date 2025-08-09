module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint/eslint-plugin"],
  extends: ["plugin:@typescript-eslint/recommended"],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [".eslintrc.js"],
  rules: {
    //TypeScript rules
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "error", // forbid explicit any
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-floating-promises": "error", // must handle promises
    "@typescript-eslint/no-misused-promises": "error", // prevent passing promises where a function is expected
    "@typescript-eslint/consistent-type-imports": "warn", // enforce `import type`
    "@typescript-eslint/prefer-nullish-coalescing": "warn", // prefer ?? over ||
    "@typescript-eslint/prefer-optional-chain": "warn", // prefer ?. over &&
    // General JS rules
    "no-console": ["warn", { allow: ["warn", "error"] }],
    curly: ["error", "all"], // always require braces
    "padding-line-between-statements": [
      "warn",
      { blankLine: "always", prev: "block-like", next: "*" },
      { blankLine: "always", prev: "*", next: "return" },
    ],
  },
};
