import pkg from "../../../package.json";
import { GeneralResponseDto } from "../dto/general-response.dto";

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
