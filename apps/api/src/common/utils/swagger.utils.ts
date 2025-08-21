import { ApiProperty } from "@nestjs/swagger";
import { GeneralResponseDto } from "../dto/general-response.dto";
import { PaginationDto } from "../dto/pagination.dto";

/** Creates a Swagger DTO */
function createResponseDto<T>(classRef: new () => T) {
  class ResponseDto extends GeneralResponseDto<T> {
    @ApiProperty({ type: classRef })
    data: T;
  }

  Object.defineProperty(ResponseDto, "name", {
    value: getDtoName(classRef),
  });

  return ResponseDto;
}

/** Creates a Swagger List DTO */
function createResponseListDto<T>(
  classRef: new () => T,
): new () => GeneralResponseDto<PaginationDto<T>> {
  // Create a concrete PaginationDto with correct items type
  class PaginatedItemsDto extends PaginationDto<T> {
    @ApiProperty({
      description: "List of items",
      type: classRef,
      isArray: true,
    })
    items: T[];
  }

  // Create a concrete GeneralResponseDto with correct data type
  class ResponseListDto extends GeneralResponseDto<PaginationDto<T>> {
    @ApiProperty({ type: PaginatedItemsDto })
    data: PaginationDto<T>;
  }

  // Dynamically rename the class so Swagger generates unique schemas
  Object.defineProperty(ResponseListDto, "name", {
    value: getDtoName(classRef, true),
  });

  return ResponseListDto;
}

/** Gets the name of the DTO */
function getDtoName<T>(classRef: new () => T, isList: boolean = false) {
  const name = classRef.name.endsWith("Dto")
    ? classRef.name.slice(0, -3)
    : classRef.name;

  return isList ? `${name}ResponseListDto` : `${name}ResponseDto`;
}

export function ApiResponseDto<T>(classRef: new () => T) {
  return createResponseDto(classRef);
}

export function ApiResponseListDto<T>(classRef: new () => T) {
  return createResponseListDto(classRef);
}
