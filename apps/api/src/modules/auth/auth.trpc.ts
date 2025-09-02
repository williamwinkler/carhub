import { Injectable } from "@nestjs/common";
import { TrpcService } from "../trpc/trpc.service";
import { AuthService } from "./auth.service";
import { loginSchema } from "./dto/login.dto";

@Injectable()
export class AuthTrpc {
  constructor(
    private readonly trpc: TrpcService,
    private readonly authService: AuthService,
  ) {}

  router = this.trpc.router({
    login: this.trpc.procedure
      .input(loginSchema)
      .mutation(async ({ input }) => {
        return await this.authService.login(input.username, input.password);
      }),
  });
}
