import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { User } from "./entities/user.entity";
import { UsersAdapter } from "./users.adapter";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { UsersTrpc } from "./users.trpc";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersAdapter, UsersTrpc],
  exports: [UsersService, UsersAdapter, UsersTrpc],
})
export class UsersModule {}
