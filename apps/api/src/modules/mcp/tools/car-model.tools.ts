// import {
//   limitSchema,
//   skipSchema,
//   uuidSchema,
// } from "@api/common/schemas/common.schema";
// import { Injectable } from "@nestjs/common";
// import { Tool } from "@rekog/mcp-nest";
// import { z } from "zod";
// import { CarModelsService } from "../../car-models/car-models.service";

// @Injectable()
// export class CarModelMcpTools {
//   constructor(private readonly modelsService: CarModelsService) {}

//   @Tool({
//     name: "models-list",
//     description:
//       "List all car models with optional filtering by manufacturer and pagination support.",
//     parameters: z.object({
//       manufacturerId: uuidSchema
//         .optional()
//         .describe("Filter models by manufacturer ID"),
//       skip: skipSchema
//         .optional()
//         .describe("Number of models to skip for pagination"),
//       limit: limitSchema
//         .optional()
//         .describe("Maximum number of models to return"),
//     }),
//   })
//   async listModels(params: any, context: any) {
//     await context.reportProgress({ progress: 50, total: 100 });

//     const result = await this.modelsService.findAll({
//       manufacturerId: params.manufacturerId,
//       skip: params.skip || 0,
//       limit: params.limit || 20,
//     });

//     await context.reportProgress({ progress: 100, total: 100 });

//     return {
//       models: result.items,
//       pagination: result.meta,
//       message: `Found ${result.meta.count} car models`,
//     };
//   }

//   @Tool({
//     name: "models-get",
//     description:
//       "Get detailed information about a specific car model by ID, including manufacturer information.",
//     parameters: z.object({
//       id: uuidSchema.describe("The ID of the car model to retrieve"),
//     }),
//   })
//   async getModel(params: any, context: any) {
//     const model = await this.modelsService.findById(params.id);

//     if (!model) {
//       throw new Error(`Car model with ID ${params.id} not found`);
//     }

//     return {
//       model,
//       message: `Retrieved car model: ${model.manufacturer.name} ${model.name}`,
//     };
//   }
// }
