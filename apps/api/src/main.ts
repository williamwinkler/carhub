/* eslint-disable no-console */
import { Logger, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
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
    bodyParser: false,
    bufferLogs: true,
    logger: new CustomLogger(),
  });

  const configService = app.get(ConfigService);

  app.enableCors({
    origin:
      configService.get("NODE_ENV") === "development"
        ? ["http://localhost:3000", "http://localhost:3001"]
        : "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Accept-Language",
      "Content-Language",
      "x-trpc-source",
      "x-trpc-batch",
      "x-api-key",
      "refresh_token",
    ],
    optionsSuccessStatus: 200,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: "v",
    defaultVersion: "1",
  });

  app.use(cookieParser()); // Parse cookies for httpOnly refresh tokens

  if (configService.get("NODE_ENV") === "development") {
    const trpcLogger = new Logger("tRPC");

    app.use("/trpc", (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();

      res.on("finish", () => {
        const duration = Date.now() - start;
        trpcLogger.debug(
          `${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Duration: ${duration}ms`,
        );
      });

      next();
    });
  }

  app.get(TrpcRouter).applyMiddleware(app);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.useGlobalPipes(new ZodValidationPipe());

  setupSwagger(app);

  const port = configService.get("PORT");
  await app.listen(port);
  if (configService.get("NODE_ENV") === "development") {
    console.log(`✨ Application started (v${pkg.version}) ✨`);
    console.log(`🚀 Server ready on: http://localhost:${port}`);
    console.log(`📡 tRPC ready on:   http://localhost:${port}/trpc`);
    console.log(`📚 Swagger UI:      http://localhost:${port}/docs`);
    console.log(`🐘 PG Admin:        http://localhost:${5050}`);
  }
}

void bootstrap();
