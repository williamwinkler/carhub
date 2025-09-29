import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigService } from "../config/config.service";
import { ConfigModule } from "../config/config.module";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [forwardRef(() => ConfigModule)],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("POSTGRES_HOST"),
        port: configService.get("POSTGRES_PORT"),
        database: configService.get("POSTGRES_DATABASE"),
        username: configService.get("POSTGRES_USERNAME"),
        password: configService.get("POSTGRES_PASSWORD"),
        synchronize: configService.get("NODE_ENV") !== "production",
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
