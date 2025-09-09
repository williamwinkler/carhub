import { Module } from "@nestjs/common";
import { UsersAdapter } from "./users.adapter";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersAdapter],
  exports: [UsersService],
})
export class UsersModule {}
