import { Module } from "@nestjs/common";
import { UsersAdapter } from "./users.adapter";
import { UsersService } from "./users.service";

@Module({
  controllers: [],
  providers: [UsersService, UsersAdapter],
  exports: [UsersService, UsersAdapter],
})
export class UsersModule {}
