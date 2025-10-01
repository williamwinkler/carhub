/**
 * Custom tRPC link for automatic token refresh on 401 responses
 * Compatible with tRPC v11
 *
 * This link pauses all requests during token refresh and retries them
 * with the new access token after successful refresh.
 */
import { TRPCClientError, TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import type { AnyRouter } from "@trpc/server";

interface RefreshTokenLinkOptions {
  /**
   * Get the current refresh token from storage
   */
  getRefreshToken: () => string | null;

  /**
   * Fetch new JWT pair using the refresh token
   * This should use a separate tRPC client without auth/interceptors
   */
  fetchJwtPairByRefreshToken: (
    refreshToken: string,
  ) => Promise<{ accessToken: string; refreshToken: string }>;

  /**
   * Called when new JWT pair is successfully fetched
   */
  onJwtPairFetched: (tokens: {
    accessToken: string;
    refreshToken: string;
  }) => void;

  /**
   * Called when token refresh fails
   */
  onRefreshFailed?: () => void;
}

// Track ongoing refresh attempts to prevent concurrent refreshes
let refreshPromise: Promise<{
  accessToken: string;
  refreshToken: string;
} | null> | null = null;

export function refreshTokenLink<TRouter extends AnyRouter>(
  options: RefreshTokenLinkOptions,
): TRPCLink<TRouter> {
  return () => {
    return ({ next, op }) => {
      return observable((observer) => {
        const { getRefreshToken, fetchJwtPairByRefreshToken, onJwtPairFetched, onRefreshFailed } = options;

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
              // Not a 401, pass through the error
              observer.error(err);
              return;
            }

            // Handle 401 - attempt token refresh
            const handleRefresh = async () => {
              try {
                // If already refreshing, wait for existing refresh
                if (refreshPromise) {
                  const tokens = await refreshPromise;
                  if (!tokens) {
                    // Refresh failed
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
                const currentRefreshToken = getRefreshToken();
                if (!currentRefreshToken) {
                  // No refresh token available
                  if (onRefreshFailed) {
                    onRefreshFailed();
                  }
                  observer.error(err);
                  return;
                }

                // Create refresh promise
                refreshPromise = fetchJwtPairByRefreshToken(currentRefreshToken)
                  .then((tokens) => {
                    onJwtPairFetched(tokens);
                    return tokens;
                  })
                  .catch((refreshError) => {
                    console.error("Token refresh failed:", refreshError);
                    if (onRefreshFailed) {
                      onRefreshFailed();
                    }
                    return null;
                  })
                  .finally(() => {
                    // Clear the promise after refresh completes
                    refreshPromise = null;
                  });

                const tokens = await refreshPromise;

                if (!tokens) {
                  // Refresh failed
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
