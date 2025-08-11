import { ApiProperty } from "@nestjs/swagger";
import pkg from "../../../package.json";
import { GeneralResponseDto } from "../dto/general-response.dto";
import { PaginationDto } from "../dto/pagination.dto";

/** Creates a Swagger DTO */
export function createResponseDto<T>(classRef: new () => T) {
  class ResponseDto extends GeneralResponseDto<T> {
    @ApiProperty({ type: classRef })
    data: T;
  }

  return ResponseDto;
}

/** Creates a Swagger List DTO */
export function createResponseListDto<T>(
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

  return ResponseListDto;
}

/** Wraps the data in the general API response DTO */
export function wrapResponse<T>(data: T): GeneralResponseDto<T> {
  return {
    apiVersion: pkg.version,
    data,
  };
}

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
