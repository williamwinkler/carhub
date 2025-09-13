/* eslint-disable @typescript-eslint/no-explicit-any */
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
    .addApiKey(
      {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
      },
      "apiKey",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  for (const path of Object.values(document.paths)) {
    for (const method of Object.values(path)) {
      // Add base error responses
      method.responses["500"] = {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: { $ref: getSchemaPath(ErrorDto) },
          },
        },
      };
      method.responses["429"] = {
        description: "Too Many Requests",
        content: {
          "application/json": {
            schema: { $ref: getSchemaPath(ErrorDto) },
          },
        },
      };

      // Public overrides everything
      if ((method as any)["x-public"] === true) {
        delete method.security;
        delete (method as any)["x-public"];
      } else {
        // Not public → need security
        if (!method.security) {
          // If no decorator already set → default to both
          method.security = [{ bearer: [] }, { apiKey: [] }];
        }
        // else: keep whatever @ApiBearerAuth() / @ApiSecurity("apiKey") already put there
        // (so only apiKey or only bearer if explicitly decorated)
      }

      // Add 401/403 only to secured endpoints
      if (method.security) {
        method.responses["401"] = {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: getSchemaPath(ErrorDto) },
            },
          },
        };
        method.responses["403"] = {
          description: "Forbidden",
          content: {
            "application/json": {
              schema: { $ref: getSchemaPath(ErrorDto) },
            },
          },
        };
      }

      // 400 response if params/body present
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
