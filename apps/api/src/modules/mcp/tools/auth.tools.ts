// import { Injectable } from "@nestjs/common";
// import { Tool } from "@rekog/mcp-nest";
// import { z } from "zod";
// import { AuthService } from "../../auth/auth.service";

// @Injectable()
// export class AuthMcpTools {
//   constructor(private readonly authService: AuthService) {}

//   @Tool({
//     name: "auth-login",
//     description:
//       "Authenticate a user with username and password. Returns JWT tokens for accessing protected resources.",
//     parameters: z.object({
//       username: z.string().min(1).describe("Username for authentication"),
//       password: z.string().min(1).describe("Password for authentication"),
//     }),
//   })
//   async login(params: any, context: any) {
//     await context.reportProgress({ progress: 50, total: 100 });

//     const result = await this.authService.login(
//       params.username,
//       params.password,
//     );

//     await context.reportProgress({ progress: 100, total: 100 });

//     return {
//       tokens: result,
//       message: `Successfully authenticated user: ${params.username}`,
//     };
//   }

//   @Tool({
//     name: "auth-logout",
//     description: "Logout the current user. This invalidates their session.",
//     parameters: z.object({}),
//   })
//   async logout(params: any, context: any) {
//     await this.authService.logout();

//     return {
//       message: "Successfully logged out",
//     };
//   }
// }
