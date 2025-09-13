import { Ctx } from "@api/common/ctx";
import { Injectable } from "@nestjs/common";
import { z } from "zod";
import { TrpcService } from "../trpc/trpc.service";
import { UsersService } from "../users/users.service";
import { AuthService } from "./auth.service";
import { loginSchema } from "./dto/login.dto";
import { refreshTokenSchema } from "./dto/refresh-token.dto";

@Injectable()
export class AuthTrpc {
  constructor(
    private readonly trpc: TrpcService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  router = this.trpc.router({
    login: this.trpc.procedure
      .input(loginSchema)
      .mutation(async ({ input }) => {
        return await this.authService.login(input.username, input.password);
      }),

    logout: this.trpc.authenticatedProcedure
      .mutation(async () => {
        await this.authService.logout();
        return { success: true };
      }),

    refreshToken: this.trpc.procedure
      .input(refreshTokenSchema)
      .mutation(async ({ input }) => {
        return await this.authService.refreshTokens(input.refreshToken);
      }),

    me: this.trpc.authenticatedProcedure
      .query(async () => {
        const userId = Ctx.userIdRequired();
        const user = await this.usersService.findById(userId);
        if (!user) {
          throw new Error("User not found");
        }
        
        // Don't return sensitive fields
        const { password, apiKey, ...safeUser } = user;
        return safeUser;
      }),
  });
}
