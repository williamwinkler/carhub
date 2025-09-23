import type z from "zod";
import type { sortDirectionQuerySchema } from "../schemas/common.schema";

export type Pagination<T> = {
  items: T[];
  meta: {
    totalItems: number;
    limit: number;
    skipped: number;
    count: number;
  };
};

export type SortDirection = z.infer<typeof sortDirectionQuerySchema>;
