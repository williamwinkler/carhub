import { CacheModule } from "@nestjs/cache-manager";
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";
import { ClsModule } from "nestjs-cls";
import { ZodValidationPipe } from "nestjs-zod";
import { HttpErrorFilter } from "./common/filters/http-error.filter";
import { AuthGuard } from "./common/guards/auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { CustomThrottlerGuard } from "./common/guards/throttler.guard";
import { ResponseWrapperInterceptor } from "./common/interceptors/response-wrapper.interceptor";
import { TrafficInterceptor } from "./common/interceptors/traffic.interceptor";
import { ContextMiddleware } from "./common/middlewares/context.middleware";
import { AuthModule } from "./modules/auth/auth.module";
import { CarManufacturersModule } from "./modules/car-manufacturers/car-manufacturers.module";
import { CarModelsModule } from "./modules/car-models/car-models.module";
import { CarsModule } from "./modules/cars/cars.module";
import { ConfigModule } from "./modules/config/config.module";
import { DatabaseModule } from "./modules/database/database.module";
import { McpModule } from "./modules/mcp/mcp.module";
import { TrpcModule } from "./modules/trpc/trpc.modules";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true }, // Wrap each request in the CLS context
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000,
        limit: 3,
      },
      {
        name: "medium",
        ttl: 10000,
        limit: 20,
      },
      {
        name: "long",
        ttl: 60000,
        limit: 100,
      },
    ]),
    JwtModule,
    AuthModule,
    UsersModule,
    TrpcModule,
    McpModule,
    CarManufacturersModule,
    CarModelsModule,
    CarsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe, // Validates @Body DTOs
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TrafficInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor, // Wraps responses with apiVersion
    },
    {
      provide: APP_FILTER,
      useClass: HttpErrorFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard, // Ratelimiting
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ContextMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
