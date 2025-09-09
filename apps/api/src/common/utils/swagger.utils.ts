/* eslint-disable @typescript-eslint/no-explicit-any */
import { SetMetadata, Type, applyDecorators } from "@nestjs/common";
import { ApiProperty, ApiResponse, ApiResponseOptions } from "@nestjs/swagger";
import z from "zod";
import { GeneralResponseDto } from "../dto/general-response.dto";
import { PaginationDto } from "../dto/pagination.dto";

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
export function ApiResponseDto<T>(
  options: Omit<ApiResponseOptions, "type"> & { type: Type<T> },
): <F extends MethodReturning<SingleResponse<T>>>(
  target: object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<F>,
) => void;

export function ApiResponseDto<T>(
  options: Omit<ApiResponseOptions, "type"> & { type: [Type<T>] },
): <F extends MethodReturning<ListResponse<T>>>(
  target: object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<F>,
) => void;

export function ApiResponseDto<T>(
  options: Omit<ApiResponseOptions, "type"> & { type: Type<T> | [Type<T>] },
) {
  const isList = Array.isArray(options.type);
  const classRef = (
    isList ? (options.type as [Type<T>])[0] : (options.type as Type<T>)
  ) as Type<T>;

  const dtoClass = isList
    ? createResponseListDto(classRef)
    : createResponseDto(classRef);

  // Grab zod schema if the DTO was made with createZodDto
  const schema = (classRef as any)?.schema;

  const base = applyDecorators(
    ApiResponse({ status: 200, ...options, type: dtoClass }),
    SetMetadata(RESPONSE_DTO_KEY, {
      classRef,
      isList,
      schema,
    } as ResponseDtoMeta<T>),
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
