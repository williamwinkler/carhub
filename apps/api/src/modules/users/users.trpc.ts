import { UsersAdapter } from "@api/modules/users/users.adapter";
// src/modules/users/users.trpc.ts
import { Ctx } from "@api/common/ctx";
import { Injectable } from "@nestjs/common";
import { TrpcService } from "../trpc/trpc.service";
import { UsersService } from "./users.service";

@Injectable()
export class UsersTrpc {
  constructor(
    private readonly trpc: TrpcService,
    private readonly usersService: UsersService,
    private readonly usersAdapter: UsersAdapter,
  ) {}

  router = this.trpc.router({
    // Authenticated route - get current user's favorite cars
    getMe: this.trpc.authenticatedProcedure.query(async () => {
      const userId = Ctx.userIdRequired();

      const user = await this.usersService.findById(userId);

      return this.usersAdapter.getUserDto(user!);
    }),
  });
}
