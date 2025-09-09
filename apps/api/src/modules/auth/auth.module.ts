import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "../config/config.module";
import { ConfigService } from "../config/config.service";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthTrpc } from "./auth.trpc";

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        global: true,
        secret: config.get("JWT_ACCESS_SECRET"),
        signOptions: { expiresIn: "60s", algorithm: "HS256" },
      }),
    }),
  ],
  providers: [AuthService, AuthTrpc],
  controllers: [AuthController],
  exports: [AuthService, AuthTrpc],
})
export class AuthModule {}
