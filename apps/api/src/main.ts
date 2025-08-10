/* eslint-disable no-console */
import { patchNestJsSwagger, ZodValidationPipe } from "nestjs-zod";
patchNestJsSwagger();

import { VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
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
  app.setGlobalPrefix("api");

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: "v",
    defaultVersion: "1",
  });

  app.useGlobalPipes(new ZodValidationPipe());

  const trpcRouter = app.get(TrpcRouter);
  await trpcRouter.applyMiddleware(app);

  if (process.env.NODE_ENV === "development") {
    const config = new DocumentBuilder()
      .setTitle("🔥 Next Gen Nestjs API")
      .setDescription(pkg.description)
      .setVersion(pkg.version)
      .build();

    const document = SwaggerModule.createDocument(app, config);

    const yamlString = YAML.stringify(document);
    const outputPath = resolve(process.cwd(), "swagger.yml");
    writeFileSync(outputPath, yamlString, { encoding: "utf8" });

    SwaggerModule.setup("docs", app, document);
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  if (process.env.NODE_ENV === "development") {
    console.log(`✨ Application started (v${pkg.version}) ✨`);
    console.log(`🚀 Server ready on: http://localhost:${port}/api`);
    console.log(`📡 tRPC ready on:   http://localhost:${port}/trpc`);
    console.log(`📚 Swagger UI:      http://localhost:${port}/docs`);
  }
}

void bootstrap();
