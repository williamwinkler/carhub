/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExecutionContext } from "@nestjs/common";
import { BadRequestException, createParamDecorator } from "@nestjs/common";
import type { ZodTypeAny } from "zod";
import z from "zod";
import type { BadRequestErrorResponse } from "../errors/bad-request-error.dto";
import { BadRequestErrorCode } from "../errors/bad-request-error.dto";

type SwaggerDecorator = (options: any) => MethodDecorator; // ⚠️ Change this

export function createZodParamDecorator(
  swaggerDecorator: SwaggerDecorator,
  source: "query" | "param",
) {
  return function zodParam<T extends ZodTypeAny>(
    name: string,
    schema: T,
  ): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => {
      if (typeof propertyKey !== "string") {
        throw new Error(
          "Zod decorators can only be used on method parameters, not constructor parameters.",
        );
      }

      // Apply Swagger decorator
      const methodDecorator = swaggerDecorator({
        name,
        required: !schema.isOptional?.(),
        description: schema._def.description,
        ...(isEnumSchema(schema)
          ? {
              schema: {
                type: "string",
                enum: extractEnumValues(schema),
                default: getDefaultValueSafe(schema),
              },
            }
          : {
              type: mapZodTypeToSwaggerType(schema),
              example: getDefaultValueSafe(schema),
            }),
      });

      // Apply the method decorator properly
      methodDecorator(
        target,
        propertyKey,
        Object.getOwnPropertyDescriptor(target, propertyKey) ||
          Object.getOwnPropertyDescriptor(
            target.constructor.prototype,
            propertyKey,
          )!,
      );

      // Apply runtime validation parameter decorator
      createParamDecorator((data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const value =
          source === "query" ? request.query[name] : request.params[name];

        const wrappedSchema = z.object({ [name]: schema });
        const parsed = wrappedSchema.safeParse({ [name]: value });

        if (!parsed.success) {
          const issues = parsed.error.issues.map((issue) => ({
            received: (issue as any).received ?? undefined,
            code: issue.code,
            options: (issue as any).options ?? undefined,
            path: issue.path,
            message: issue.message,
          }));

          throw new BadRequestException({
            statusCode: 400,
            errorCode: BadRequestErrorCode.VALIDATION_ERROR,
            message: "Validation failed",
            errors: issues,
          } satisfies BadRequestErrorResponse);
        }

        return parsed.data[name];
      })(target, propertyKey, parameterIndex);
    };
  };
}

export function mapZodTypeToSwaggerType(zodType: any) {
  const unwrapped = unwrapZodType(zodType);
  const typeName = unwrapped._def.typeName;
  switch (typeName) {
    case "ZodString":
      return String;
    case "ZodNumber":
      return Number;
    case "ZodBoolean":
      return Boolean;
    case "ZodNativeEnum":
    case "ZodEnum":
      return undefined;
    default:
      return String;
  }
}

export function extractEnumValues(zodType: any) {
  const unwrapped = unwrapZodType(zodType);

  if (
    unwrapped._def?.typeName === z.ZodFirstPartyTypeKind.ZodNativeEnum ||
    unwrapped._def?.typeName === z.ZodFirstPartyTypeKind.ZodEnum
  ) {
    const values = unwrapped._def.values;

    return Array.isArray(values) ? values : Object.values(values);
  }

  return undefined;
}

export function isEnumSchema(zodType: any): boolean {
  const unwrapped = unwrapZodType(zodType);

  return (
    unwrapped._def?.typeName === z.ZodFirstPartyTypeKind.ZodNativeEnum ||
    unwrapped._def?.typeName === z.ZodFirstPartyTypeKind.ZodEnum
  );
}

export function getDefaultValueSafe<T>(schema: z.ZodTypeAny): T | undefined {
  const unwrapped = unwrapToDefault(schema);
  if (
    unwrapped &&
    unwrapped._def?.typeName === z.ZodFirstPartyTypeKind.ZodDefault
  ) {
    return unwrapped._def.defaultValue();
  }

  return undefined;
}

function unwrapZodType(zodType: any): any {
  if (!zodType?._def) {
    return zodType;
  }

  switch (zodType._def.typeName) {
    case z.ZodFirstPartyTypeKind.ZodOptional:
    case z.ZodFirstPartyTypeKind.ZodNullable:
    case z.ZodFirstPartyTypeKind.ZodDefault:
      return unwrapZodType(zodType._def.innerType);
    default:
      return zodType;
  }
}

function unwrapToDefault(schema: z.ZodTypeAny): z.ZodTypeAny | undefined {
  if (!schema?._def) {
    return undefined;
  }

  switch (schema._def.typeName) {
    case z.ZodFirstPartyTypeKind.ZodDefault:
      return schema;
    case z.ZodFirstPartyTypeKind.ZodOptional:
    case z.ZodFirstPartyTypeKind.ZodNullable:
      return unwrapToDefault(schema._def.innerType);
    default:
      return undefined;
  }
}
