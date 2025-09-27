// import { Ctx } from "@api/common/ctx";
// import { uuidSchema } from "@api/common/schemas/common.schema";
// import { Injectable } from "@nestjs/common";
// import { Context, Tool } from "@rekog/mcp-nest";
// import { z } from "zod";
// import { AuthService } from "../../auth/auth.service";
// import { UsersAdapter } from "../../users/users.adapter";
// import { UsersService } from "../../users/users.service";
// import { McpAuthHelper } from "../mcp-auth.helper";

// // Schemas
// const getUserSchema = z.object({
//   id: uuidSchema,
// });

// const getUserByUsernameSchema = z.object({
//   username: z.string().min(1),
// });

// const updateUserSchema = z.object({
//   id: uuidSchema,
//   updates: z.object({
//     firstName: z.string().min(1).optional(),
//     lastName: z.string().min(1).optional(),
//     role: z.enum(["user", "admin"]).optional(),
//   }),
// });

// const deleteUserSchema = z.object({
//   id: uuidSchema,
// });

// const updateProfileSchema = z.object({
//   firstName: z.string().min(1).max(100),
//   lastName: z.string().min(1).max(100),
// });

// type GetUserParams = z.infer<typeof getUserSchema>;
// type GetUserByUsernameParams = z.infer<typeof getUserByUsernameSchema>;
// type UpdateUserParams = z.infer<typeof updateUserSchema>;
// type DeleteUserParams = z.infer<typeof deleteUserSchema>;
// type UpdateProfileParams = z.infer<typeof updateProfileSchema>;

// @Injectable()
// export class UserMcpTools {
//   constructor(
//     private readonly usersService: UsersService,
//     private readonly authHelper: McpAuthHelper,
//     private readonly authService: AuthService,
//     private readonly usersAdapter: UsersAdapter,
//   ) {}

//   @Tool({
//     name: "users-get",
//     description:
//       "Get detailed information about a specific user by their ID. This includes profile information like name, username, role, and account status. Admin access required.",
//     parameters: getUserSchema,
//   })
//   async getUser(params: GetUserParams, context: Context) {
//     return this.authHelper.executeAsAdmin(context.request, async () => {
//       const user = await this.usersService.findById(params.id);

//       if (!user) {
//         throw new Error(`User with ID ${params.id} not found`);
//       }

//       return {
//         user: this.usersAdapter.getUserDto(user),
//         message: `Retrieved user: ${user.firstName} ${user.lastName} (@${user.username})`,
//       };
//     });
//   }

//   @Tool({
//     name: "users-get-by-username",
//     description:
//       "Find a user by their username. Useful for looking up users by their handle. Admin access required.",
//     parameters: getUserByUsernameSchema,
//   })
//   async getUserByUsername(params: GetUserByUsernameParams, context: Context) {
//     return this.authHelper.executeAsAdmin(context.request, async () => {
//       const user = await this.usersService.findByUsername(params.username);

//       if (!user) {
//         throw new Error(`User with username '${params.username}' not found`);
//       }

//       return {
//         user: this.usersAdapter.getUserDto(user),
//         message: `Found user: ${user.firstName} ${user.lastName} (@${user.username})`,
//       };
//     });
//   }

//   @Tool({
//     name: "users-update",
//     description:
//       "Update user profile information. Only admins can update role, and users can only update their own profile (except for admins). Authenticated access required.",
//     parameters: updateUserSchema,
//   })
//   async updateUser(params: UpdateUserParams, context: Context) {
//     return this.authHelper.executeAsUser(context.request, async () => {
//       await context.reportProgress({ progress: 50, total: 100 });

//       const user = await this.usersService.update(params.id, params.updates);

//       await context.reportProgress({ progress: 100, total: 100 });

//       return {
//         user: this.usersAdapter.getUserDto(user),
//         message: `Successfully updated user: ${user.firstName} ${user.lastName} (@${user.username})`,
//       };
//     });
//   }

//   @Tool({
//     name: "users-delete",
//     description:
//       "Delete a user account (soft delete). This will also soft delete all cars owned by the user. Admin privileges required.",
//     parameters: deleteUserSchema,
//   })
//   async deleteUser(params: DeleteUserParams, context: Context) {
//     return this.authHelper.executeAsAdmin(context.request, async () => {
//       await context.reportProgress({ progress: 50, total: 100 });

//       await this.usersService.softDelete(params.id);

//       await context.reportProgress({ progress: 100, total: 100 });

//       return {
//         message: `Successfully deleted user with ID: ${params.id}`,
//       };
//     });
//   }

//   @Tool({
//     name: "users-profile",
//     description:
//       "Get the profile of the currently authenticated user. Returns the current user's information based on the authentication context.",
//     parameters: z.object({}),
//   })
//   async getCurrentUserProfile(params: Record<string, never>, context: Context) {
//     return this.authHelper.executeAsUser(context.request, async () => {
//       const userId = Ctx.userIdRequired();
//       const user = await this.usersService.findById(userId);

//       if (!user) {
//         throw new Error("Current user not found");
//       }

//       // Remove sensitive information
//       const { password, apiKeySecret, apiKeyLookupHash, ...safeUser } = user;

//       return {
//         user: this.usersAdapter.getUserDto(user),
//         message: `Retrieved current user profile: ${user.firstName} ${user.lastName} (@${user.username})`,
//       };
//     });
//   }

//   @Tool({
//     name: "users-update-profile",
//     description:
//       "Update the current user's profile information (first name and last name). Authentication required.",
//     parameters: updateProfileSchema,
//   })
//   async updateCurrentUserProfile(
//     params: UpdateProfileParams,
//     context: Context,
//   ) {
//     return this.authHelper.executeAsUser(context.request, async () => {
//       await context.reportProgress({ progress: 50, total: 100 });

//       const userId = Ctx.userIdRequired();
//       const updatedUser = await this.usersService.update(userId, params);

//       await context.reportProgress({ progress: 100, total: 100 });

//       return {
//         user: this.usersAdapter.getUserDto(updatedUser),
//         message: `Successfully updated profile: ${updatedUser.firstName} ${updatedUser.lastName}`,
//       };
//     });
//   }

//   @Tool({
//     name: "users-generate-api-key",
//     description:
//       "Generate a new API key for the current user. This will replace any existing API key. Authentication required.",
//     parameters: z.object({}),
//   })
//   async generateApiKey(params: Record<string, never>, context: Context) {
//     return this.authHelper.executeAsUser(context.request, async () => {
//       const apiKey = await this.authService.createApiKey();

//       return {
//         apiKey,
//         hasApiKey: true,
//         message: "Successfully generated new API key",
//       };
//     });
//   }

//   @Tool({
//     name: "users-has-api-key",
//     description:
//       "Check if the current user has an API key configured. Authentication required.",
//     parameters: z.object({}),
//   })
//   async hasApiKey(params: Record<string, never>, context: Context) {
//     return this.authHelper.executeAsUser(context.request, async () => {
//       const userId = Ctx.userIdRequired();
//       const user = await this.usersService.findById(userId, [
//         "apiKeyLookupHash",
//       ]);

//       const hasApiKey = !!user?.apiKeyLookupHash;

//       return {
//         hasApiKey,
//         message: hasApiKey
//           ? "User has an API key"
//           : "User does not have an API key",
//       };
//     });
//   }
// }
