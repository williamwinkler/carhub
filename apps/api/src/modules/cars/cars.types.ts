import type { UUID } from "crypto";
import type { z } from "zod";
import type {
  sortDirectionSchema,
  sortFieldSchema,
} from "../../common/schemas/common.schema";

export type SortField = z.infer<typeof sortFieldSchema>;
export type SortDirection = z.infer<typeof sortDirectionSchema>;

export type FindAllCarsOptions = {
  modelId?: UUID;
  color?: string;
  skip: number;
  limit: number;
  sortField?: SortField;
  sortDirection?: SortDirection;
};

export type GetAllFavoritesOptions = {
  userId: UUID;
  skip: number;
  limit: number;
};
