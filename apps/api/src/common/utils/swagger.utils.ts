/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  HttpCode,
  HttpStatus,
  SetMetadata,
  Type,
  applyDecorators,
} from "@nestjs/common";
import {
  ApiExtraModels,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiResponseOptions,
  getSchemaPath,
} from "@nestjs/swagger";
import z from "zod";
import { SwaggerError } from "../decorators/swagger-responses.decorator";
import { GeneralResponseDto } from "../dto/general-response.dto";
import { PaginationDto } from "../dto/pagination.dto";
import { ErrorDto } from "../errors/error.dto";
import { EntryToKey, ErrorEntry } from "../errors/errors";

export const RESPONSE_DTO_KEY = "responseDto";

export interface ResponseDtoMeta<T = any> {
  classRef: Type<T>; // the DTO class (CarDto, UserDto, etc.)
  isList: boolean; // whether it's a list response
  schema?: z.ZodTypeAny; // Zod schema from createZodDto
}

type SingleResponse<T> = Promise<T>;
type ListResponse<T> = Promise<PaginationDto<T>>;
type MethodReturning<T> = (...args: any[]) => T;

// unchanged helpers
function getDtoName<T>(classRef: new () => T, isList = false) {
  const name = classRef.name.endsWith("Dto")
    ? classRef.name.slice(0, -3)
    : classRef.name;

  return isList ? `${name}ResponseListDto` : `${name}ResponseDto`;
}

function createResponseDto<T>(classRef: new () => T) {
  class ResponseDto extends GeneralResponseDto<T> {
    @ApiProperty({ type: classRef })
    data: T;
  }
  Object.defineProperty(ResponseDto, "name", { value: getDtoName(classRef) });

  return ResponseDto;
}

function createResponseListDto<T>(classRef: new () => T) {
  class PaginatedItemsDto extends PaginationDto<T> {
    @ApiProperty({
      description: `List of ${classRef.name} items`,
      type: classRef,
      isArray: true,
    })
    items: T[];
  }

  class ResponseListDto extends GeneralResponseDto<PaginationDto<T>> {
    @ApiProperty({ type: PaginatedItemsDto })
    data: PaginationDto<T>;
  }

  Object.defineProperty(ResponseListDto, "name", {
    value: getDtoName(classRef, true),
  });

  Object.defineProperty(ResponseListDto, "PaginatedItemsDto", {
    value: PaginatedItemsDto,
  });

  return ResponseListDto as unknown as {
    new (): GeneralResponseDto<PaginationDto<T>>;
    PaginatedItemsDto: new () => PaginationDto<T>;
  };
}

// Strongly-typed overloads
export function SwaggerInfo<T>(
  options: Omit<ApiResponseOptions, "description"> & {
    type: Type<T>;
    status?: HttpStatus;
    summary?: string;
    successText?: string;
    errors?: ErrorEntry[];
  },
): <F extends MethodReturning<SingleResponse<T>>>(
  target: object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<F>,
) => void;

export function SwaggerInfo<T>(
  options: Omit<ApiResponseOptions, "description"> & {
    type: [Type<T>];
    status?: HttpStatus;
    summary?: string;
    successText?: string;
    errors?: ErrorEntry[];
  },
): <F extends MethodReturning<ListResponse<T>>>(
  target: object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<F>,
) => void;

export function SwaggerInfo(
  options: Omit<ApiResponseOptions, "description"> & {
    type: null;
    status?: HttpStatus;
    summary?: string;
    successText?: string;
    errors?: ErrorEntry[];
  },
): <F extends MethodReturning<Promise<void>>>(
  target: object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<F>,
) => void;

/**
 * Decorator for defining type safe swagger specifications.
 * @param returnType - The DTO returned by the endpoint. Examples:
 * - `MyDto` to return a single DTO.
 * - `[MyDto]` to return a paginated list of DTOs.
 * - `null` when returning no content.
 * @param status - The HTTP status code to be returned on succes
 * @param summary - Swagger endpoint summary
 * @param successText - The text to show on succesful requests.
 * @param errors - potential errors thrown by the endpoint.
 */
export function SwaggerInfo<T>(
  options: Omit<ApiResponseOptions, "description"> & {
    type: Type<T> | [Type<T>] | null;
    status?: HttpStatus;
    summary?: string;
    successText?: string;
    errors?: ErrorEntry[];
  },
) {
  const summary = options.summary;
  delete options.summary;
  options.status = options.status ?? HttpStatus.OK;
  (options as any).description = options.successText;
  delete options.successText;

  let dtoClass: Type<unknown> | undefined = undefined;
  let classRef: Type<T> | undefined = undefined;
  let schema: any = undefined;

  const isList = Array.isArray(options.type);

  if (options.type) {
    classRef = (
      isList ? (options.type as [Type<T>])[0] : (options.type as Type<T>)
    ) as Type<T>;

    dtoClass = isList
      ? createResponseListDto(classRef)
      : createResponseDto(classRef);

    // Grab zod schema if the DTO was made with createZodDto
    schema = (classRef as any)?.schema;
  }

  // Group errors by status code to create single ApiResponse with multiple examples
  const errorsByStatus = new Map<number, ErrorEntry[]>();
  options?.errors?.forEach((error) => {
    const existing = errorsByStatus.get(error.status) ?? [];
    existing.push(error);
    errorsByStatus.set(error.status, existing);
  });

  const errorDecorators: MethodDecorator[] = [];
  errorsByStatus.forEach((errors, status) => {
    if (errors.length === 1) {
      // Single error for this status - use simple decorator
      errorDecorators.push(SwaggerError(errors[0]));
    } else {
      // Multiple errors for same status - merge examples
      const examples: Record<string, any> = {};
      errors.forEach((error) => {
        const errorCode = EntryToKey.get(error);
        if (errorCode) {
          const exampleValue: any = {
            statusCode: error.status,
            errorCode,
            message: error.message,
          };

          // Add validation errors example for VALIDATION_ERROR
          if (errorCode === "VALIDATION_ERROR") {
            exampleValue.errors = [
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
            ];
          }

          examples[errorCode] = {
            summary: `${errorCode} Error`,
            value: exampleValue,
          };
        }
      });

      // Use first error's message as description
      const description = errors[0].message;

      errorDecorators.push(
        applyDecorators(
          ApiExtraModels(ErrorDto),
          ApiResponse({
            status,
            description,
            schema: {
              $ref: getSchemaPath(ErrorDto),
            },
            examples,
          }),
        ),
      );
    }
  });

  const base = applyDecorators(
    HttpCode(options.status),
    ...(summary ? [ApiOperation({ summary: summary })] : []),
    ...(dtoClass
      ? [
          ApiResponse({ ...options, type: dtoClass }),
          SetMetadata(RESPONSE_DTO_KEY, {
            classRef,
            isList,
            schema,
          } as ResponseDtoMeta<T>),
        ]
      : []),
    ...errorDecorators,
  );

  if (isList) {
    return base as unknown as <F extends MethodReturning<ListResponse<T>>>(
      target: object,
      propertyKey: string | symbol,
      descriptor: TypedPropertyDescriptor<F>,
    ) => void;
  }

  return base as unknown as <F extends MethodReturning<SingleResponse<T>>>(
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<F>,
  ) => void;
}
