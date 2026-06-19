import { Ctx } from "@api/common/ctx";
import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import { Inject, Injectable } from "@nestjs/common";
import { Input, Mutation, Query, Router, UseMiddlewares } from "nestjs-trpc";
import { z } from "zod";
import { AuthService } from "../auth/auth.service";
import { TrpcAuthMiddleware } from "../trpc/trpc.middlewares";
import { usersFields } from "../users/users.schema";
import { UsersService } from "../users/users.service";
import { AccountsAdapter } from "./acounts.adapter";
import { accountSchema, type AccountDto } from "./dto/account.dto";

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});
const getByUsernameSchema = z.object({ username: usersFields.username });
const apiKeyResponseSchema = z
  .object({ apiKey: z.string(), hasApiKey: z.boolean() })
  .strict();
const hasApiKeyResponseSchema = z.object({ hasApiKey: z.boolean() }).strict();

type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
type GetByUsernameInput = z.infer<typeof getByUsernameSchema>;

@Router({ alias: "accounts" })
@Injectable()
export class AccountsTrpc {
  constructor(
    @Inject(UsersService) private readonly usersService: UsersService,
    @Inject(AccountsAdapter) private readonly accountsAdapter: AccountsAdapter,
    @Inject(AuthService) private readonly authService: AuthService,
  ) {}

  // Get current user profile
  @UseMiddlewares(TrpcAuthMiddleware)
  @Query({ output: accountSchema })
  async getMe() {
    const userId = Ctx.userIdRequired();
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new AppError(Errors.USER_NOT_FOUND);
    }

    return this.accountsAdapter.getDto(user);
  }

  // Update current user profile
  @UseMiddlewares(TrpcAuthMiddleware)
  @Mutation({ input: updateProfileSchema, output: accountSchema })
  async updateProfile(@Input() input: UpdateProfileInput) {
    const userId = Ctx.userIdRequired();
    const updatedUser = await this.usersService.update(userId, input);

    return this.accountsAdapter.getDto(updatedUser);
  }

  // Generate new API key
  @UseMiddlewares(TrpcAuthMiddleware)
  @Mutation({ output: apiKeyResponseSchema })
  async generateApiKey(): Promise<{ apiKey: string; hasApiKey: boolean }> {
    const apiKey = await this.authService.createApiKey();

    return {
      apiKey,
      hasApiKey: true,
    };
  }

  // Check if user has an API key
  @UseMiddlewares(TrpcAuthMiddleware)
  @Query({ output: hasApiKeyResponseSchema })
  async hasApiKey(): Promise<{ hasApiKey: boolean }> {
    const userId = Ctx.userIdRequired();
    const user = await this.usersService.findById(userId, ["apiKeyLookupHash"]);

    return {
      hasApiKey: !!user?.apiKeyLookupHash,
    };
  }

  @Query({ input: getByUsernameSchema, output: accountSchema })
  async getByUsername(@Input() input: GetByUsernameInput): Promise<AccountDto> {
    const user = await this.usersService.findByUsername(input.username);
    if (!user) {
      throw new AppError(Errors.USER_NOT_FOUND);
    }

    return this.accountsAdapter.getDto(user);
  }
}
