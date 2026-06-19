import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const generatedPath = resolve("src/@generated/server.ts");
const hadGeneratedFile = existsSync(generatedPath);
const before = hadGeneratedFile ? readFileSync(generatedPath, "utf8") : "";

const result = spawnSync(
  "pnpm",
  [
    "exec",
    "nestjs-trpc",
    "generate",
    "--entrypoint",
    "src/app.module.ts",
    "--router-pattern",
    "**/*.trpc.ts",
  ],
  {
    cwd: process.cwd(),
    encoding: "utf8",
  },
);

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.status ?? 1);
}

const after = existsSync(generatedPath)
  ? readFileSync(generatedPath, "utf8")
  : "";

if (before !== after) {
  if (hadGeneratedFile) {
    writeFileSync(generatedPath, before);
  } else if (existsSync(generatedPath)) {
    rmSync(generatedPath);
  }

  process.stderr.write(
    [
      "Generated tRPC router is stale.",
      "Run: pnpm --filter api trpc:generate",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

process.stdout.write("Generated tRPC router is up to date.\n");
