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
import { TrpcModule } from "./modules/trpc/trpc.modules";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    JwtModule,
    ConfigModule,
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
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second
      },
      {
        name: "medium",
        ttl: 10000, // 10 seconds
        limit: 20, // 20 requests per 10 seconds
      },
      {
        name: "long",
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    AuthModule,
    UsersModule,
    TrpcModule,
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
