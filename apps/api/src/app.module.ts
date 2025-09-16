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
import { ResponseValidationInterceptor } from "./common/interceptors/response-validation.interceptor";
import { TrafficInterceptor } from "./common/interceptors/traffic.interceptor";
import { ContextMiddleware } from "./common/middlewares/context.middleware";
import { AuthModule } from "./modules/auth/auth.module";
import { CarsModule } from "./modules/cars/cars.module";
import { ConfigModule } from "./modules/config/config.module";
import { ConfigService } from "./modules/config/config.service";
import { ManufacturersModule } from "./modules/car-manufacturers/manufacturers.module";
import { ModelsModule } from "./modules/car-models/models.module";
import { TrpcModule } from "./modules/trpc/trpc.modules";
import { UsersModule } from "./modules/users/users.module";
import { DatabaseModule } from "./modules/database/database.module";

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
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        configService.getThrottlerConfig(),
      inject: [ConfigService],
    }),
    JwtModule,
    AuthModule,
    UsersModule,
    TrpcModule,
    ManufacturersModule,
    ModelsModule,
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
      useClass: ResponseValidationInterceptor, // Validates outgoing DTOs and wraps them
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
