import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule, getSchemaPath } from "@nestjs/swagger";
import { writeFileSync } from "fs";
import { resolve } from "path";
import YAML from "yaml";
import pkg from "../package.json";
import { ErrorDto } from "./common/errors/error.dto";
import { ConfigService } from "./modules/config/config.service";

export function setupSwagger(app: INestApplication) {
  // Always generate Swagger documentation for external tools
  const config = new DocumentBuilder()
    .setTitle("🔥 Next Gen Nestjs API")
    .setDescription(pkg.description)
    .setVersion(pkg.version)
    .addBearerAuth({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    })
    .addApiKey({
      type: "apiKey",
      in: "header",
      name: "x-api-key",
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  for (const path of Object.values(document.paths)) {
    for (const method of Object.values(path)) {
      // Add 500 error to each route
      method.responses["500"] = {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: { $ref: getSchemaPath(ErrorDto) },
          },
        },
      };

      // 400 response
      // Only add if the operation actually has inputs (parameters or body)
      if (method.parameters?.length || method.requestBody) {
        method.responses["400"] = {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: { $ref: getSchemaPath(ErrorDto) },
            },
          },
        };
      }
    }

    // Generate YAML file for external tools (always)
    const yamlString = YAML.stringify(document);
    const outputPath = resolve(process.cwd(), "swagger.yml");
    writeFileSync(outputPath, yamlString, { encoding: "utf8" });

    // Only serve Swagger UI in development
    if (app.get(ConfigService).get("NODE_ENV") === "development") {
      SwaggerModule.setup("docs", app, document, {
        jsonDocumentUrl: "swagger/json",
      });
    }
  }
}
