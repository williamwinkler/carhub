import {
  limitSchema,
  skipSchema,
  sortDirectionQuerySchema,
} from "@api/common/schemas/common.schema";
import { carModelFields } from "@api/modules/car-models/car-models.schema";
import { Injectable } from "@nestjs/common";
import { Context, Tool } from "@rekog/mcp-nest";
import { z } from "zod";
import { carFields, carSortFieldQuerySchema } from "../../cars/cars.schema";
import { CarsService } from "../../cars/cars.service";

const carsListParams = z.object({
  modelId: carModelFields.id.optional(),
  color: carFields.color.optional(),
  skip: skipSchema,
  limit: limitSchema,
  sortField: carSortFieldQuerySchema.optional(),
  sortDirection: sortDirectionQuerySchema.optional(),
});

@Injectable()
export class CarMcpTools {
  constructor(private readonly carsService: CarsService) {}

  @Tool({
    name: "cars-list",
    description:
      "List all cars with optional filtering by model, color, and pagination. Returns cars with full details including manufacturer and model information.",
    parameters: carsListParams,
  })
  async listCars(params: z.infer<typeof carsListParams>, context: Context) {
    await context.reportProgress({ progress: 50, total: 100 });

    const result = await this.carsService.findAll({
      modelId: params.modelId,
      color: params.color,
      skip: params.skip,
      limit: params.limit,
      sortField: params.sortField,
      sortDirection: params.sortDirection,
    });

    await context.reportProgress({ progress: 100, total: 100 });

    return {
      cars: result.items,
      pagination: result.meta,
      message: `Found ${result.meta.count} cars out of ${result.meta.totalItems} total`,
    };
  }

  // @Tool({
  //   name: "cars-get",
  //   description:
  //     "Get detailed information about a specific car by its ID, including manufacturer, model, and owner information.",
  //   parameters: z.object({
  //     id: carFields.id.describe("The ID of the car to retrieve"),
  //   }),
  // })
  // async getCar(params: any, context: any) {
  //   return this.authHelper.executePublic(async () => {
  //     const car = await this.carsService.findById(params.id);

  //     if (!car) {
  //       throw new Error(`Car with ID ${params.id} not found`);
  //     }

  //     return {
  //       car,
  //       message: `Retrieved ${car.model.manufacturer.name} ${car.model.name} (${car.year})`,
  //     };
  //   });
  // }

  // @Tool({
  //   name: "cars-create",
  //   description:
  //     "Create a new car listing. Requires authentication. The car will be associated with the authenticated user.",
  //   parameters: createCarSchema.describe(
  //     "Car details for creating a new listing",
  //   ),
  // })
  // async createCar(params: any, context: any) {
  //   return this.authHelper.executeAsUser(context.request, async () => {
  //     await context.reportProgress({ progress: 25, total: 100 });

  //     const car = await this.carsService.create(params);

  //     await context.reportProgress({ progress: 100, total: 100 });

  //     return {
  //       car,
  //       message: `Successfully created car listing: ${car.model.manufacturer.name} ${car.model.name} (${car.year})`,
  //     };
  //   });
  // }

  // @Tool({
  //   name: "cars-update",
  //   description:
  //     "Update an existing car listing. Only the owner of the car or an admin can update it.",
  //   parameters: z.object({
  //     id: carFields.id.describe("The ID of the car to update"),
  //     updates: updateCarSchema.describe("Fields to update on the car"),
  //   }),
  // })
  // async updateCar(params: any, context: any) {
  //   return this.authHelper.executeAsUser(context.request, async () => {
  //     await context.reportProgress({ progress: 50, total: 100 });

  //     const car = await this.carsService.update(params.id, params.updates);

  //     await context.reportProgress({ progress: 100, total: 100 });

  //     return {
  //       car,
  //       message: `Successfully updated car: ${car.model.manufacturer.name} ${car.model.name} (${car.year})`,
  //     };
  //   });
  // }

  // @Tool({
  //   name: "cars-delete",
  //   description:
  //     "Delete a car listing (soft delete). Only the owner of the car or an admin can delete it.",
  //   parameters: z.object({
  //     id: carFields.id.describe("The ID of the car to delete"),
  //   }),
  // })
  // async deleteCar(params: any, context: any) {
  //   return this.authHelper.executeAsUser(context.request, async () => {
  //     await context.reportProgress({ progress: 50, total: 100 });

  //     await this.carsService.softDelete(params.id);

  //     await context.reportProgress({ progress: 100, total: 100 });

  //     return {
  //       message: `Successfully deleted car with ID: ${params.id}`,
  //     };
  //   });
  // }

  // @Tool({
  //   name: "cars-toggle-favorite",
  //   description:
  //     "Toggle favorite status for a car. If the car is already favorited, it will be unfavorited, and vice versa.",
  //   parameters: z.object({
  //     carId: carFields.id.describe(
  //       "The ID of the car to toggle favorite status",
  //     ),
  //   }),
  // })
  // async toggleFavorite(params: any, context: any) {
  //   return this.authHelper.executeAsUser(context.request, async () => {
  //     await context.reportProgress({ progress: 50, total: 100 });

  //     const userId = Ctx.userIdRequired();
  //     await this.carsService.toggleFavoriteForUser(params.carId, userId);

  //     await context.reportProgress({ progress: 100, total: 100 });

  //     return {
  //       message: `Successfully toggled favorite status for car ${params.carId}`,
  //     };
  //   });
  // }

  // @Tool({
  //   name: "cars-by-user",
  //   description:
  //     "Get all cars owned by a specific user with pagination support.",
  //   parameters: z.object({
  //     userId: uuidSchema.describe("The ID of the user whose cars to retrieve"),
  //     skip: skipSchema
  //       .optional()
  //       .describe("Number of cars to skip for pagination"),
  //     limit: limitSchema
  //       .optional()
  //       .describe("Maximum number of cars to return"),
  //   }),
  // })
  // async getCarsByUser(params: any, context: any) {
  //   return this.authHelper.executePublic(async () => {
  //     await context.reportProgress({ progress: 50, total: 100 });

  //     const result = await this.carsService.getCarsByUser({
  //       userId: params.userId,
  //       skip: params.skip || 0,
  //       limit: params.limit || 20,
  //     });

  //     await context.reportProgress({ progress: 100, total: 100 });

  //     return {
  //       cars: result.items,
  //       pagination: result.meta,
  //       message: `Found ${result.meta.count} cars owned by user ${params.userId}`,
  //     };
  //   });
  // }
}
