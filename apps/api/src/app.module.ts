import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { ClsModule } from "nestjs-cls";
import { ZodValidationPipe } from "nestjs-zod";
import { TrafficInterceptor } from "./common/interceptors/traffic.interceptor";
import { WrapResponseInterceptor } from "./common/interceptors/wrap-response.interceptor";
import { ContextMiddleware } from "./common/middlewares/context.middleware";
import { AuthModule } from "./modules/auth/auth.module";
import { CarsModule } from "./modules/cars/cars.module";
import { TrpcModule } from "./modules/trpc/trpc.modules";
import { UsersModule } from "./modules/users/users.module";
import { HttpErrorFilter } from "./common/filters/http-error.filter";

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true }, // Wrap each request in the CLS context
    }),
    AuthModule,
    ConfigModule,
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
    }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ContextMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
