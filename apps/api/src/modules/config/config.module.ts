import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { validateEnv } from "./config.schema";
import { ConfigService } from "./config.service";

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => validateEnv(env),
      envFilePath:
        process.env.NODE_ENV === "production"
          ? undefined // Production uses environment variables from deployment
          : process.env.NODE_ENV === "test"
            ? ".env.test"
            : ".env.local",
      expandVariables: true,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
