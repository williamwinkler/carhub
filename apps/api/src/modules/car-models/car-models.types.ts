import type { SortDirection } from "@api/common/types/common.types";
import type { CarModelSortField } from "./car-models.schema";

export interface FindAllCarModelsOptions {
  manufacturerSlug?: string;
  skip?: number;
  limit?: number;
  sortField?: CarModelSortField;
  sortDirection?: SortDirection;
}
