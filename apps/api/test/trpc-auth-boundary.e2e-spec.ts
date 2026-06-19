import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import { REFRESH_TOKEN_COOKIE_NAME } from "@api/modules/auth/auth.consts";
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

      const verifyAccessToken = mocks.authService
        .verifyAccessToken as jest.Mock;
      verifyAccessToken.mockRejectedValueOnce(
        new AppError(Errors.UNAUTHORIZED),
      );
      const invalidJwtClient = createTRPCProxyClient<AppRouter>({
        links: [
          httpBatchLink({
            url,
            headers: { authorization: "Bearer invalid.jwt.token" },
          }),
        ],
      });
      await expect(
        invalidJwtClient.accounts.getMe.query(),
      ).rejects.toMatchObject({
        data: expect.objectContaining({ code: "UNAUTHORIZED" }),
      });

      const authClient = createTRPCProxyClient<AppRouter>({
        links: [httpBatchLink({ url })],
      });
      await expect(
        authClient.auth.login.mutate({
          username: "william",
          password: "secret1",
        }),
      ).resolves.toMatchObject({ accessToken: expect.any(String) });
      expect(mocks.authService.login).toHaveBeenCalledWith(
        "william",
        "secret1",
      );

      const refreshClient = createTRPCProxyClient<AppRouter>({
        links: [
          httpBatchLink({
            url,
            headers: { cookie: `${REFRESH_TOKEN_COOKIE_NAME}=refresh-token` },
          }),
        ],
      });
      await expect(refreshClient.auth.refreshToken.mutate()).resolves.toEqual({
        accessToken:
          "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAifQ.signature",
      });
      expect(mocks.authService.refreshToken).toHaveBeenCalledWith(
        "refresh-token",
      );
    } finally {
      await app.close();
    }
  });
});
