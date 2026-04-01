/**
 * Application-wide constants
 */

// API Configuration
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
export const API_DOCS_URL = `${API_URL}/docs`;

// Pagination
export const DEFAULT_PAGE_LIMIT = 12;
export const HOME_PAGE_CAR_LIMIT = 6;

// Sort Options
export const SORT_BY_OPTIONS = {
  CREATED_AT: "createdAt",
  PRICE: "price",
  YEAR: "year",
  KM_DRIVEN: "kmDriven",
} as const;

export const SORT_DIRECTION_OPTIONS = {
  ASC: "asc",
  DESC: "desc",
} as const;

export type SortBy = (typeof SORT_BY_OPTIONS)[keyof typeof SORT_BY_OPTIONS];
export type SortDirection =
  (typeof SORT_DIRECTION_OPTIONS)[keyof typeof SORT_DIRECTION_OPTIONS];
