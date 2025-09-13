import type { z } from "zod";
import type {
  sortDirectionSchema,
  sortFieldSchema,
} from "../../common/schemas/common.schema";
import type { CarBrandType } from "./entities/car.entity";

export type SortField = z.infer<typeof sortFieldSchema>;
export type SortDirection = z.infer<typeof sortDirectionSchema>;

export interface FindAllCarsOptions {
  brand?: CarBrandType;
  model?: string;
  color?: string;
  skip: number;
  limit: number;
  sortField?: SortField;
  sortDirection?: SortDirection;
}
