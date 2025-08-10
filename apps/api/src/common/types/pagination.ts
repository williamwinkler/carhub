export type Pagination<T> = {
  items: T[];
  meta: {
    total: number;
    limit: number;
    skipped: number;
    count: number;
  };
};
