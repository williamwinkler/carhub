import type { AppRouter } from "@api/modules/trpc/trpc.router";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { createTrpcTestApp } from "./helpers/trpc-testing";

describe("HTTP /trpc auth boundary", () => {
  it("accepts bearer JWTs and rejects API keys over the tRPC wire", async () => {
    const { app, mocks } = await createTrpcTestApp();

    try {
      await app.listen(0);
      const address = app.getHttpServer().address();
      if (!address || typeof address === "string") {
        throw new Error("Expected ephemeral test server port");
      }
      const url = `http://127.0.0.1:${address.port}/trpc`;

      const jwtClient = createTRPCProxyClient<AppRouter>({
        links: [
          httpBatchLink({
            url,
            headers: { authorization: "Bearer valid.jwt.token" },
          }),
        ],
      });
      await expect(jwtClient.accounts.getMe.query()).resolves.toMatchObject({
        id: "550e8400-e29b-41d4-a716-446655440000",
        username: "william",
      });
      expect(mocks.authService.verifyAccessToken).toHaveBeenCalledWith(
        "valid.jwt.token",
      );

      const apiKeyClient = createTRPCProxyClient<AppRouter>({
        links: [
          httpBatchLink({
            url,
            headers: { "x-api-key": "sk_test_valid" },
          }),
        ],
      });
      await expect(apiKeyClient.accounts.getMe.query()).rejects.toMatchObject({
        data: expect.objectContaining({ code: "UNAUTHORIZED" }),
      });
    } finally {
      await app.close();
    }
  });
});
