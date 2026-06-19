import type { RouterOutputs as AppRouterOutputs } from "@repo/api-contract";

export type { RouterInputs, RouterOutputs } from "@repo/api-contract";

// Common types
export type Pagination = AppRouterOutputs["cars"]["list"]["meta"];

// Specific entity types
export type Car = AppRouterOutputs["cars"]["getById"];
export type User = AppRouterOutputs["accounts"]["getMe"];
export type CarModel = AppRouterOutputs["carModels"]["list"]["items"][number];
export type CarManufacturer =
  AppRouterOutputs["carManufacturers"]["list"]["items"][number];
