/* eslint-disable no-console */
import { patchNestJsSwagger, ZodValidationPipe } from "nestjs-zod";
patchNestJsSwagger();

import { Logger, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import { writeFileSync } from "fs";
import { resolve } from "path";
import * as YAML from "yaml";
import pkg from "../package.json";
import { AppModule } from "./app.module";
import { TrpcRouter } from "./modules/trpc/trpc.router";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.enableCors();

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: "v",
    defaultVersion: "1",
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.useGlobalPipes(new ZodValidationPipe());

  if (process.env.NODE_ENV === "development") {
    const trpcLogger = new Logger("tRPC");

    // Ensure body is parsed before logger
    app.use(
      "/trpc",
      express.json(),
      (req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();

        res.on("finish", () => {
          const duration = Date.now() - start;
          trpcLogger.debug(
            `${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Duration: ${duration}ms`,
          );
        });

        next();
      },
    );
  }

  const trpcRouter = app.get(TrpcRouter);
  await trpcRouter.applyMiddleware(app);

  // Always generate Swagger documentation for external tools
  const config = new DocumentBuilder()
    .setTitle("🔥 Next Gen Nestjs API")
    .setDescription(pkg.description)
    .setVersion(pkg.version)
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Generate YAML file for external tools (always)
  const yamlString = YAML.stringify(document);
  const outputPath = resolve(process.cwd(), "swagger.yml");
  writeFileSync(outputPath, yamlString, { encoding: "utf8" });

  // Only serve Swagger UI in development
  if (process.env.NODE_ENV === "development") {
    SwaggerModule.setup("docs", app, document);
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  if (process.env.NODE_ENV === "development") {
    console.log(`✨ Application started (v${pkg.version}) ✨`);
    console.log(`🚀 Server ready on: http://localhost:${port}`);
    console.log(`📡 tRPC ready on:   http://localhost:${port}/trpc`);
    console.log(`📚 Swagger UI:      http://localhost:${port}/docs`);
  }
}

void bootstrap();
