/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExecutionContext } from "@nestjs/common";
import { createParamDecorator } from "@nestjs/common";
import { ApiParam, ApiQuery } from "@nestjs/swagger";
import type { z } from "zod";
import { ValidationError } from "../errors/domain/bad-request.error";
import { BadRequest } from "./swagger-responses.decorator";

export const zParam = createZodParamDecorator(ApiParam, "param");
export const zQuery = createZodParamDecorator(ApiQuery, "query");

type SwaggerDecorator = (options: any) => MethodDecorator;

function createZodParamDecorator(
  swaggerDecorator: SwaggerDecorator,
  source: "query" | "param",
) {
  return function zodParam<T extends z.ZodTypeAny>(
    name: string,
    schema: T,
  ): ParameterDecorator {
    const validationDecorator = createParamDecorator(
      (_: unknown, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        const rawValue =
          source === "query" ? req?.query?.[name] : req?.params?.[name];

        const parsed = schema.safeParse(rawValue);
        if (!parsed.success) {
          throw new ValidationError(parsed.error);
        }

        return parsed.data;
      },
    )();

    return (
      target: any,
      propertyKey: string | symbol | undefined,
      parameterIndex: number,
    ) => {
      if (typeof propertyKey !== "string") {
        throw new Error(
          "Zod decorators can only be used on method parameters (not constructors).",
        );
      }

      const required = !isOptionalLike(schema);
      const def = getDefaultValueSafe(schema);

      const base = unwrapForDocs(schema);
      const description = getDescription(schema);
      const example = getExample(base);
      const constraints = extractConstraints(base);

      const swaggerOpts = isEnumSchema(base)
        ? {
            name,
            required,
            description,
            example,
            schema: {
              type: "string",
              enum: extractEnumValues(base),
              default: def,
            },
          }
        : {
            name,
            required,
            description,
            example,
            ...constraintsToSwagger(base, constraints, def),
          };

      const methodDec = swaggerDecorator(swaggerOpts);
      methodDec(
        target,
        propertyKey,
        Object.getOwnPropertyDescriptor(target, propertyKey)!,
      );

      // Automatically apply the BadRequest decorator too
      const badReqDec = BadRequest();
      badReqDec(
        target,
        propertyKey,
        Object.getOwnPropertyDescriptor(target, propertyKey)!,
      );

      validationDecorator(target, propertyKey, parameterIndex);
    };
  };
}

/* ----------------- Helpers ----------------- */

function isOptionalLike(schema: z.ZodTypeAny): boolean {
  return schema.safeParse(undefined).success;
}

function getDescription(schema: z.ZodTypeAny): string | undefined {
  // Priority: 1. explicit describe() 2. meta.description
  let description = (schema as any).description;
  if (description) {
    return description;
  }

  // If no description found, traverse nested schemas to find it
  let cur: any = schema;
  while (cur && !description) {
    const typeName = cur?._def?.typeName as string | undefined;
    const type = cur?._def?.type as string | undefined;

    // Check description at current level
    description = cur.description;
    if (description) {
      return description;
    }

    // Navigate to inner types
    if (
      typeName === "ZodDefault" ||
      typeName === "ZodOptional" ||
      typeName === "ZodNullable" ||
      type === "default" ||
      type === "optional" ||
      type === "nullable"
    ) {
      cur = cur._def.innerType;
      continue;
    }

    if (typeName === "ZodEffects" || type === "effects") {
      cur = cur._def.schema; // e.g., z.coerce.number()
      continue;
    }

    break;
  }

  return description;
}

function getMetadata(schema: z.ZodTypeAny): Record<string, any> | undefined {
  try {
    const metaFn = (schema as any).meta;
    if (typeof metaFn === "function") {
      return metaFn();
    }
  } catch (error) {
    // meta() might not be available on all schema types
  }

  return undefined;
}

function getExample(schema: z.ZodTypeAny): any | undefined {
  const metadata = getMetadata(schema);

  return metadata?.example ?? undefined;
}

// Unwrap Optional/Nullable/Default/Effects using _def.typeName (classic build safe)
function unwrapForDocs<T extends z.ZodTypeAny>(schema: T): z.ZodTypeAny {
  let cur: any = schema;
  while (true) {
    const typeName = cur?._def?.typeName as string | undefined;
    const type = cur?._def?.type as string | undefined;

    // Handle both old (typeName) and new (type) Zod structures
    if (
      typeName === "ZodDefault" ||
      typeName === "ZodOptional" ||
      typeName === "ZodNullable" ||
      type === "default" ||
      type === "optional" ||
      type === "nullable"
    ) {
      cur = cur._def.innerType;
      continue;
    }

    if (typeName === "ZodEffects" || type === "effects") {
      cur = cur._def.schema; // e.g., z.coerce.number()
      continue;
    }

    break;
  }

  return cur;
}

function getDefaultValueSafe<T>(schema: z.ZodTypeAny): T | undefined {
  let cur: any = schema;

  // Check for default value at current level first
  const typeName = cur?._def?.typeName as string | undefined;
  const type = cur?._def?.type as string | undefined;

  if (typeName === "ZodDefault" || type === "default") {
    // Handle both function and direct value formats
    return typeof cur._def.defaultValue === "function"
      ? cur._def.defaultValue()
      : cur._def.defaultValue;
  }

  while (true) {
    const t = cur?._def?.typeName as string | undefined;
    const curType = cur?._def?.type as string | undefined;

    if (
      t === "ZodOptional" ||
      t === "ZodNullable" ||
      curType === "optional" ||
      curType === "nullable"
    ) {
      cur = cur._def.innerType;
      if (
        cur?._def?.typeName === "ZodDefault" ||
        cur?._def?.type === "default"
      ) {
        return typeof cur._def.defaultValue === "function"
          ? cur._def.defaultValue()
          : cur._def.defaultValue;
      }

      continue;
    }

    if (t === "ZodEffects" || curType === "effects") {
      cur = cur._def.schema;
      continue;
    }

    break;
  }

  return undefined;
}

function isEnumSchema(schema: z.ZodTypeAny): boolean {
  const t = (schema as any)?._def?.typeName;

  return t === "ZodEnum" || t === "ZodNativeEnum";
}

function extractEnumValues(schema: z.ZodTypeAny): string[] {
  const def = (schema as any)?._def;
  if (def?.typeName === "ZodEnum") {
    return (schema as any).options as string[];
  }

  if (def?.typeName === "ZodNativeEnum") {
    const values = def.values as Record<string, string | number>;

    return Object.values(values).filter(
      (v) => typeof v === "string",
    ) as string[];
  }

  return [];
}

function mapZodTypeName(schema: z.ZodTypeAny): string | undefined {
  const typeName = (schema as any)?._def?.typeName as string | undefined;
  const type = (schema as any)?._def?.type as string | undefined;

  // Handle both old Zod (typeName) and new Zod (type) structures
  if (typeName) {
    return typeName;
  }

  if (type === "string") {
    return "ZodString";
  }

  if (type === "number") {
    return "ZodNumber";
  }

  if (type === "boolean") {
    return "ZodBoolean";
  }

  return undefined;
}

/* -------- constraints extraction from Zod (classic safe) -------- */

type Constraints =
  | {
      kind: "string";
      minLength?: number;
      maxLength?: number;
      pattern?: string;
    }
  | {
      kind: "number";
      minimum?: number;
      maximum?: number;
      multipleOf?: number;
      int?: boolean;
    }
  | {
      kind: "boolean";
    }
  | {
      kind: "unknown";
    };

function extractConstraints(schema: z.ZodTypeAny): Constraints {
  const t = mapZodTypeName(schema);

  if (t === "ZodString") {
    const checks = (schema as any)?._def?.checks as
      | Array<{ kind?: string; value?: number; regex?: RegExp; _zod?: any }>
      | undefined;

    let minLength: number | undefined;
    let maxLength: number | undefined;
    let pattern: string | undefined;

    checks?.forEach((c) => {
      // Handle both old and new Zod structures
      const kind = c.kind ?? c._zod?.def?.check;
      const value = (c.value ?? c._zod?.def?.minimum) || c._zod?.def?.maximum;
      const regex = c.regex ?? c._zod?.def?.pattern;

      if (
        (kind === "min" || kind === "min_length") &&
        typeof value === "number"
      ) {
        minLength = value;
      }

      if (
        (kind === "max" || kind === "max_length") &&
        typeof value === "number"
      ) {
        maxLength = value;
      }

      if (
        (kind === "regex" || kind === "string_format") &&
        regex instanceof RegExp
      ) {
        pattern = regex.source;
      }

      if (kind === "email") {
        pattern = undefined;
      } // let swagger use format=email if you prefer

      if (kind === "uuid") {
        pattern = undefined;
      } // could set format=uuid

      if (kind === "url") {
        pattern = undefined;
      } // could set format=url
    });

    return { kind: "string", minLength, maxLength, pattern };
  }

  if (t === "ZodNumber") {
    const checks = (schema as any)?._def?.checks as
      | Array<{ kind?: string; value?: number; _zod?: any }>
      | undefined;

    let minimum: number | undefined;
    let maximum: number | undefined;
    let multipleOf: number | undefined;
    let int = false;

    checks?.forEach((c) => {
      // Handle both old and new Zod structures
      const kind = c.kind ?? c._zod?.def?.check;
      const value =
        (c.value ?? c._zod?.def?.minimum) ||
        c._zod?.def?.maximum ||
        c._zod?.def?.multipleOf;

      if (
        (kind === "min" || kind === "min_value") &&
        typeof value === "number"
      ) {
        minimum = value;
      }

      if (
        (kind === "max" || kind === "max_value") &&
        typeof value === "number"
      ) {
        maximum = value;
      }

      if (
        (kind === "multipleOf" || kind === "multiple_of") &&
        typeof value === "number"
      ) {
        multipleOf = value;
      }

      if (kind === "int" || kind === "integer") {
        int = true;
      }
    });

    return { kind: "number", minimum, maximum, multipleOf, int };
  }

  if (t === "ZodBoolean") {
    return { kind: "boolean" };
  }

  // If it's ZodLiteral of string/number you could add support similarly.
  return { kind: "unknown" };
}

/* -------- convert constraints to Swagger options -------- */

function constraintsToSwagger(
  base: z.ZodTypeAny,
  c: Constraints,
  def: unknown,
) {
  if (c.kind === "string") {
    return {
      schema: {
        type: "string",
        minLength: c.minLength,
        maxLength: c.maxLength,
        pattern: c.pattern,
        default: def,
      },
    };
  }

  if (c.kind === "number") {
    return {
      schema: {
        type: "number",
        minimum: c.minimum,
        maximum: c.maximum,
        multipleOf: c.multipleOf,
        format: c.int ? "int32" : undefined,
        default: def,
      },
    };
  }

  if (c.kind === "boolean") {
    return {
      schema: {
        type: "boolean",
        default: def,
      },
    };
  }

  return {
    schema: {
      type: "string",
      default: def,
    },
  };
}
