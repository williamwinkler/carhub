/**
 * Custom tRPC link for automatic token refresh on 401 responses
 * Compatible with tRPC v11 and httpOnly refresh tokens
 *
 * This link pauses all requests during token refresh and retries them
 * with the new access token after successful refresh.
 */
import { TRPCClientError, TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import type { AnyRouter } from "@trpc/server";

interface RefreshTokenLinkOptions {
  /**
   * Fetch new access token using httpOnly refresh token cookie
   * Server will read refresh token from cookie automatically
   */
  refreshAccessToken: () => Promise<{ accessToken: string }>;

  /**
   * Called when new access token is successfully fetched
   */
  onAccessTokenRefreshed: (accessToken: string) => void;

  /**
   * Called when token refresh fails
   */
  onRefreshFailed?: () => void;
}

// Track ongoing refresh attempts to prevent concurrent refreshes
let refreshPromise: Promise<string | null> | null = null;

export function refreshTokenLink<TRouter extends AnyRouter>(
  options: RefreshTokenLinkOptions,
): TRPCLink<TRouter> {
  return () => {
    return ({ next, op }) => {
      return observable((observer) => {
        const { refreshAccessToken, onAccessTokenRefreshed, onRefreshFailed } = options;

        // Execute the operation
        const subscription = next(op).subscribe({
          next(value) {
            observer.next(value);
          },
          error(err) {
            // Check if error is 401 Unauthorized
            const is401 =
              err instanceof TRPCClientError &&
              err.data?.httpStatus === 401;

            if (!is401) {
              observer.error(err);
              return;
            }

            // Handle 401 - attempt token refresh
            const handleRefresh = async () => {
              try {
                // If already refreshing, wait for existing refresh
                if (refreshPromise) {
                  const accessToken = await refreshPromise;
                  if (!accessToken) {
                    observer.error(err);
                    return;
                  }
                  // Refresh succeeded, retry the operation
                  next(op).subscribe({
                    next(value) {
                      observer.next(value);
                    },
                    error(retryErr) {
                      observer.error(retryErr);
                    },
                    complete() {
                      observer.complete();
                    },
                  });
                  return;
                }

                // Start new refresh
                refreshPromise = refreshAccessToken()
                  .then(({ accessToken }) => {
                    onAccessTokenRefreshed(accessToken);
                    return accessToken;
                  })
                  .catch((refreshError) => {
                    console.error("Token refresh failed:", refreshError);
                    if (onRefreshFailed) {
                      onRefreshFailed();
                    }
                    return null;
                  })
                  .finally(() => {
                    refreshPromise = null;
                  });

                const accessToken = await refreshPromise;

                if (!accessToken) {
                  observer.error(err);
                  return;
                }

                // Refresh succeeded, retry the operation
                next(op).subscribe({
                  next(value) {
                    observer.next(value);
                  },
                  error(retryErr) {
                    observer.error(retryErr);
                  },
                  complete() {
                    observer.complete();
                  },
                });
              } catch (error) {
                observer.error(err);
              }
            };

            handleRefresh();
          },
          complete() {
            observer.complete();
          },
        });

        return subscription;
      });
    };
  };
}
