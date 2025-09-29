import type { inferRouterOutputs, inferRouterInputs } from "@trpc/server";
import type { AppRouter } from "@api/modules/trpc/trpc.router";

export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;

// Specific entity types
export type Car = RouterOutputs["cars"]["getById"];
export type CarList = RouterOutputs["cars"]["list"];
export type User = RouterOutputs["auth"]["me"];
export type CarModel = RouterOutputs["carModels"]["getById"];
export type CarManufacturer = RouterOutputs["carManufacturers"]["getById"];
