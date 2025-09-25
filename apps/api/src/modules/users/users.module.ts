import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { UsersAdapter } from "./users.adapter";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { UsersTrpc } from "./users.trpc";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UsersAdapter, UsersTrpc],
  exports: [UsersService, UsersAdapter, UsersTrpc],
})
export class UsersModule {}
