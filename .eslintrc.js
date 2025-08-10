module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: [
      './apps/api/tsconfig.json',
      './apps/client/tsconfig.json',
      './packages/trpc/tsconfig.json'
    ],
    tsconfigRootDir: __dirname
  },
  plugins: ["@typescript-eslint", "prettier"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  env: {
    node: true,
    jest: true,
    browser: true
  },
  ignorePatterns: [
    ".eslintrc.js",
    "node_modules",
    "dist",
    ".next"
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/consistent-type-imports": "warn",
    "@typescript-eslint/prefer-nullish-coalescing": "warn",
    "@typescript-eslint/prefer-optional-chain": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "no-console": ["warn", { allow: ["warn", "error"] }],
    curly: ["error", "all"],
    "padding-line-between-statements": [
      "warn",
      { blankLine: "always", prev: "block-like", next: "*" },
      { blankLine: "always", prev: "*", next: "return" }
    ],
    "prettier/prettier": "error"
  }
};
