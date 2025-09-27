import { Module } from "@nestjs/common";
import { McpModule as McpNestModule, McpTransportType } from "@rekog/mcp-nest";
import { randomUUID } from "crypto";
import pkg from "../../../package.json";
import { AuthModule } from "../auth/auth.module";
import { CarManufacturersModule } from "../car-manufacturers/car-manufacturers.module";
import { CarModelsModule } from "../car-models/car-models.module";
import { CarsModule } from "../cars/cars.module";
import { UsersModule } from "../users/users.module";
import { CarMcpTools } from "./tools/car.tools";

@Module({
  imports: [
    McpNestModule.forRoot({
      name: pkg.name,
      version: pkg.version,
      transport: [McpTransportType.SSE],
      mcpEndpoint: "mcp",
    }),
    CarsModule,
    UsersModule,
    AuthModule,
    CarManufacturersModule,
    CarModelsModule,
  ],
  providers: [
    CarMcpTools,
    // UserMcpTools,
    // AuthMcpTools,
    // CarManufacturerMcpTools,
    // CarModelMcpTools,
  ],
})
export class McpModule {}
