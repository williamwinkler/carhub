import type { SortDirection } from "@api/common/types/common.types";
import type { UUID } from "crypto";
import type { z } from "zod";
import type { carSortFieldQuerySchema } from "./cars.schema";

export type CarSortField = z.infer<typeof carSortFieldQuerySchema>;

export type FindAllCarsOptions = {
  modelId?: UUID;
  color?: string;
  sortField?: CarSortField;
  sortDirection?: SortDirection;
  skip: number;
  limit: number;
};

export type FindAllByUserOptions = {
  userId: UUID;
  skip: number;
  limit: number;
};
