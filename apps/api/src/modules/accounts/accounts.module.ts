import { forwardRef, Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { AccountsAdapter } from "./acounts.adapter";
import { UsersController } from "./accounts.controller";

@Module({
  imports: [forwardRef(() => AuthModule), UsersModule],
  controllers: [UsersController],
  providers: [AccountsAdapter],
  exports: [AccountsAdapter],
})
export class AccountsModule {}
