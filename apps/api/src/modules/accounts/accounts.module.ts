import { forwardRef, Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { AccountsTrpc } from "./accounts.trpc";
import { AccountsAdapter } from "./acounts.adapter";

@Module({
  imports: [forwardRef(() => AuthModule), UsersModule],
  providers: [AccountsTrpc, AccountsAdapter],
  exports: [AccountsTrpc],
})
export class AccountsModule {}
