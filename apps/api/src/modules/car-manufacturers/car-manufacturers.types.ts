import type { SortDirection } from "@api/common/types/common.types";
import type { CarManufacturerSortField } from "./car-manufacturers.schema";

export type FindAllCarManufacturersOptions = {
  skip?: number;
  limit?: number;
  sortField?: CarManufacturerSortField;
  sortDirection?: SortDirection;
};
