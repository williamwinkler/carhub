import type { SortDirection } from "@api/common/types/common.types";
import type { UUID } from "crypto";
import type { CarModelSortField } from "./car-models.schema";

export interface FindAllCarModelsOptions {
  manufacturerId?: UUID;
  skip?: number;
  limit?: number;
  sortField?: CarModelSortField;
  sortDirection?: SortDirection;
}
