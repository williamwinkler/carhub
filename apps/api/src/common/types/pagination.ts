export type Pagination<T> = {
  items: T[];
  meta: {
    totalItems: number;
    limit: number;
    skipped: number;
    count: number;
  };
};
