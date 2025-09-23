/* eslint-disable @typescript-eslint/no-explicit-any */
import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule, getSchemaPath } from "@nestjs/swagger";
import { writeFileSync } from "fs";
import { resolve } from "path";
import YAML from "yaml";
import pkg from "../package.json";
import { ErrorDto } from "./common/errors/error.dto";
import { Errors } from "./common/errors/errors";
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
      // Add base error responses with concrete examples
      method.responses["500"] = {
        description: Errors.UNEXPECTED_ERROR.message,
        content: {
          "application/json": {
            schema: { $ref: getSchemaPath(ErrorDto) },
            examples: {
              default: {
                summary: "UNEXPECTED_ERROR Error",
                value: {
                  statusCode: Errors.UNEXPECTED_ERROR.status,
                  errorCode: "UNEXPECTED_ERROR",
                  message: Errors.UNEXPECTED_ERROR.message,
                },
              },
            },
          },
        },
      };
      method.responses["429"] = {
        description: Errors.TOO_MANY_REQUESTS.message,
        content: {
          "application/json": {
            schema: { $ref: getSchemaPath(ErrorDto) },
            examples: {
              default: {
                summary: "TOO_MANY_REQUESTS Error",
                value: {
                  statusCode: Errors.TOO_MANY_REQUESTS.status,
                  errorCode: "TOO_MANY_REQUESTS",
                  message: Errors.TOO_MANY_REQUESTS.message,
                },
              },
            },
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

      // Add 401/403 only to secured endpoints with concrete examples
      if (method.security) {
        method.responses["401"] = {
          description: Errors.UNAUTHORIZED.message,
          content: {
            "application/json": {
              schema: { $ref: getSchemaPath(ErrorDto) },
              examples: {
                default: {
                  summary: "UNAUTHORIZED Error",
                  value: {
                    statusCode: Errors.UNAUTHORIZED.status,
                    errorCode: "UNAUTHORIZED",
                    message: Errors.UNAUTHORIZED.message,
                  },
                },
              },
            },
          },
        };
        method.responses["403"] = {
          description: "Forbidden",
          content: {
            "application/json": {
              schema: { $ref: getSchemaPath(ErrorDto) },
              examples: {
                default: {
                  summary: "FORBIDDEN Error",
                  value: {
                    statusCode: 403,
                    errorCode: "FORBIDDEN",
                    message: "Forbidden",
                  },
                },
              },
            },
          },
        };
      }

      // 400 response if params/body present - use concrete validation error example
      if (method.parameters?.length || method.requestBody) {
        method.responses["400"] = {
          description: Errors.VALIDATION_ERROR.message,
          content: {
            "application/json": {
              schema: { $ref: getSchemaPath(ErrorDto) },
              examples: {
                default: {
                  summary: "VALIDATION_ERROR Error",
                  value: {
                    statusCode: Errors.VALIDATION_ERROR.status,
                    errorCode: "VALIDATION_ERROR",
                    message: Errors.VALIDATION_ERROR.message,
                    errors: [
                      {
                        field: "email",
                        message: "Invalid email format",
                        code: "invalid_string",
                      },
                      {
                        field: "age",
                        message: "Must be at least 18",
                        code: "too_small",
                      },
                    ],
                  },
                },
              },
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
