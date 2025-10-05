import type { inferRouterOutputs, inferRouterInputs } from "@trpc/server";
import type { AppRouter } from "@api/modules/trpc/trpc.router";

export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;

// Common types
export type Pagination = RouterOutputs["cars"]["list"]["meta"];

// Specific entity types
export type Car = RouterOutputs["cars"]["getById"];
export type User = RouterOutputs["accounts"]["getMe"];
export type CarModel = RouterOutputs["carModels"]["list"]["items"][number];
export type CarManufacturer = RouterOutputs["carManufacturers"]["list"]["items"][number];
