/* eslint-disable no-console */
import { Logger, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import { ZodValidationPipe } from "nestjs-zod";
import pkg from "../package.json";
import { AppModule } from "./app.module";
import { CustomLogger } from "./common/logging/custom-logger";
import { ConfigService } from "./modules/config/config.service";
import { TrpcRouter } from "./modules/trpc/trpc.router";
import { setupSwagger } from "./setup-swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: new CustomLogger(),
  });

  app.enableCors();

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: "v",
    defaultVersion: "1",
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.useGlobalPipes(new ZodValidationPipe()); // for tRPC

  const configService = app.get(ConfigService);

  if (configService.get("NODE_ENV") === "development") {
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

  setupSwagger(app);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  if (configService.get("NODE_ENV") === "development") {
    console.log(`✨ Application started (v${pkg.version}) ✨`);
    console.log(`🚀 Server ready on: http://localhost:${port}`);
    console.log(`📡 tRPC ready on:   http://localhost:${port}/trpc`);
    console.log(`📚 Swagger UI:      http://localhost:${port}/docs`);
  }
}

void bootstrap();
