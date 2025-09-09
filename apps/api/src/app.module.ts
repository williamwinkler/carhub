import { CacheModule } from "@nestjs/cache-manager";
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { ClsModule } from "nestjs-cls";
import { ZodValidationPipe } from "nestjs-zod";
import { HttpErrorFilter } from "./common/filters/http-error.filter";
import { AuthGuard } from "./common/guards/auth.guard";
import { TrafficInterceptor } from "./common/interceptors/traffic.interceptor";
import { WrapResponseInterceptor } from "./common/interceptors/wrap-response.interceptor";
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
    AuthModule,
    UsersModule,
    TrpcModule,
    CarsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TrafficInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: WrapResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpErrorFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
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
