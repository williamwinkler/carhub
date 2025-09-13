import { CarBrandType } from "@repo/shared";
import { z } from "zod";
import {
  sortDirectionSchema,
  sortFieldSchema,
} from "../../common/schemas/common.schema";

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
