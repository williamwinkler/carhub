// import {
//   limitSchema,
//   skipSchema,
//   uuidSchema,
// } from "@api/common/schemas/common.schema";
// import { Injectable } from "@nestjs/common";
// import { Tool, Context } from "@rekog/mcp-nest";
// import { z } from "zod";
// import { CarManufacturersService } from "../../car-manufacturers/car-manufacturers.service";

// @Injectable()
// export class CarManufacturerMcpTools {
//   constructor(private readonly manufacturersService: CarManufacturersService) {}

//   @Tool({
//     name: "manufacturers-list",
//     description:
//       "List all car manufacturers with pagination support. Returns manufacturers with their associated car models.",
//     parameters: z.object({
//       skip: skipSchema
//         .optional()
//         .describe("Number of manufacturers to skip for pagination"),
//       limit: limitSchema
//         .optional()
//         .describe("Maximum number of manufacturers to return"),
//     }),
//   })
//   async listManufacturers({ skip, limit }, context: Context) {
//     await context.reportProgress({ progress: 50, total: 100 });

//     const result = await this.manufacturersService.findAll({
//       skip: skip || 0,
//       limit: limit || 20,
//     });

//     await context.reportProgress({ progress: 100, total: 100 });

//     return {
//       manufacturers: result.items,
//       pagination: result.meta,
//       message: `Found ${result.meta.count} manufacturers`,
//     };
//   }

//   @Tool({
//     name: "manufacturers-get",
//     description:
//       "Get detailed information about a specific car manufacturer by ID, including all their car models.",
//     parameters: z.object({
//       id: uuidSchema.describe("The ID of the manufacturer to retrieve"),
//     }),
//   })
//   async getManufacturer(params: any, context: any) {
//     const manufacturer = await this.manufacturersService.findById(params.id);

//     if (!manufacturer) {
//       throw new Error(`Manufacturer with ID ${params.id} not found`);
//     }

//     return {
//       manufacturer,
//       message: `Retrieved manufacturer: ${manufacturer.name}`,
//     };
//   }
// }
