import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ApiParam } from "@nestjs/swagger";
import { z, ZodTypeAny } from "zod";
import { BadRequestErrorCode } from "../errors/bad-request-error.dto";
import { BadRequestError } from "../errors/bad-request.exception";

interface ZodParamOptions {
  description?: string;
}

export function zParam<T extends ZodTypeAny>(
  name: string,
  schema: T,
  options: ZodParamOptions = {},
): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    if (propertyKey === undefined) {
      throw new Error(
        "ZodParam can only be used on method parameters, not constructor parameters.",
      );
    }

    const description =
      options.description ?? (schema._def.description as string | undefined);

    // Swagger param doc
    ApiParam({
      name,
      required: !schema.isOptional?.(),
      type: mapZodTypeToSwaggerType(schema),
      enum: extractEnumValues(schema),
      description,
    })(
      target,
      propertyKey,
      Object.getOwnPropertyDescriptor(target, propertyKey)!,
    );

    // Actual param decorator
    const paramDecorator = createParamDecorator(
      (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const value = request.params[name];

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

          throw new BadRequestError(
            "Validation failed",
            BadRequestErrorCode.VALIDATION_ERROR,
            issues,
          );
        }

        return parsed.data[name];
      },
    )(name);

    paramDecorator(target, propertyKey, parameterIndex);
  };
}

function unwrapZodType(zodType: any): any {
  if (
    zodType._def?.typeName === "ZodOptional" ||
    zodType._def?.typeName === "ZodNullable"
  ) {
    return unwrapZodType(zodType._def.innerType);
  }
  return zodType;
}

function mapZodTypeToSwaggerType(zodType: any) {
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
      return String;
    default:
      return String;
  }
}

function extractEnumValues(zodType: any) {
  const unwrapped = unwrapZodType(zodType);
  return unwrapped._def?.values ?? undefined;
}
