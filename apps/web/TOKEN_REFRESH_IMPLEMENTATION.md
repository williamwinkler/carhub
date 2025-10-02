# Token Refresh Implementation with tRPC v11

This document explains the automatic token refresh implementation in this Next.js application using tRPC v11.

## Overview

The implementation follows best practices for handling JWT access token expiration by automatically refreshing tokens when a 401 Unauthorized response is received from the API.

## Architecture

### Key Components

1. **Custom Refresh Token Link** (`src/lib/refresh-token-link.ts`)
   - Custom tRPC link compatible with tRPC v11
   - Intercepts 401 responses and triggers token refresh
   - Pauses all requests during refresh to prevent race conditions
   - Retries failed requests with new access token after successful refresh

2. **tRPC Provider** (`src/app/_trpc/Provider.tsx`)
   - Configures tRPC client with refresh token link
   - Creates separate client for refresh endpoint (no auth/interceptors)
   - Manages token lifecycle through callbacks

3. **Token Management** (`src/lib/token-refresh.ts`)
   - Exports `triggerLogout()` for handling refresh failures
   - Manages global logout callback from AuthProvider

4. **Cookie Utilities** (`src/lib/cookies.ts`)
   - Secure token storage using HttpOnly cookies
   - JWT expiry-aware cookie management

## How It Works

### 1. Normal Request Flow

```
User Action
  → tRPC Query/Mutation
  → HTTP Request with Authorization: Bearer {accessToken}
  → API Response
  → Success
```

### 2. Token Refresh Flow

```
User Action
  → tRPC Query/Mutation
  → HTTP Request with expired access token
  → API Returns 401 Unauthorized
  → Refresh Token Link intercepts 401
  → Pauses all pending requests
  → Calls refresh endpoint with refresh token
  → Receives new token pair
  → Updates cookies
  → Retries original request with new access token
  → Success
```

### 3. Refresh Failure Flow

```
401 Response
  → Refresh attempt fails
  → onRefreshFailed callback
  → triggerLogout()
  → Clear cookies
  → Update AuthContext
  → Show "Session expired" toast
  → User redirected to login
```

## Implementation Details

### Preventing Concurrent Refreshes

The refresh token link uses a shared promise to prevent multiple simultaneous refresh attempts:

```typescript
let refreshPromise: Promise<Tokens | null> | null = null;

// If already refreshing, wait for existing refresh
if (refreshPromise) {
  const tokens = await refreshPromise;
  // Use tokens for retry
}

// Otherwise, start new refresh
refreshPromise = fetchJwtPairByRefreshToken(refreshToken)
  .finally(() => {
    refreshPromise = null; // Clear when done
  });
```

### Separate Refresh Client

To avoid circular dependencies and infinite loops, we create a dedicated client for the refresh endpoint:

```typescript
const refreshClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${apiUrl}/trpc`,
      // No authorization header
      // No 401 interceptor
    }),
  ],
});
```

### API Configuration

The refresh endpoint must be public (no authentication required):

```typescript
// ✅ Correct - Public endpoint
refreshToken: this.trpc.mediumRateLimitProcedure
  .input(refreshTokenSchema)
  .mutation(async ({ input }) => {
    return await this.authService.refreshTokens(input.refreshToken);
  })

// ❌ Wrong - Creates circular dependency
refreshToken: this.trpc.authenticatedProcedure // Requires valid token!
```

## Benefits

### ✅ Race Condition Prevention
- Only one refresh attempt at a time
- All concurrent 401s wait for the same refresh

### ✅ Seamless User Experience
- Automatic token renewal
- No interruption to user workflow
- No manual re-login required

### ✅ Type Safety
- Full end-to-end type safety with tRPC
- TypeScript ensures correct token structure

### ✅ Security
- HttpOnly cookies prevent XSS attacks
- Secure flag in production
- SameSite strict policy

### ✅ Clean Architecture
- Separation of concerns
- Reusable refresh link
- Easy to test and maintain

## Configuration

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Cookie Settings

```typescript
// Development
secure: false
sameSite: 'strict'

// Production
secure: true
sameSite: 'strict'
```

### Token Expiry

- **Access Token**: 15 minutes (set by API)
- **Refresh Token**: 7 days (set by API)

## Testing

To test the token refresh flow:

1. Login to the application
2. Wait for access token to expire (15 minutes)
3. Perform any action (query/mutation)
4. Observe automatic token refresh in Network tab
5. Action completes successfully without re-login

## Troubleshooting

### Issue: User gets logged out when token expires

**Cause 1**: Refresh endpoint requires authentication

**Solution**: Ensure refresh endpoint uses public procedure:
```typescript
refreshToken: this.trpc.mediumRateLimitProcedure // Not authenticatedProcedure
```

**Cause 2**: AuthProvider's `checkAuthChanges` effect logs out when access token is missing

**Problem**: The periodic check (every 3-10s) was logging out users when the access token expired, even though the refresh token was still valid.

**Solution**: Only logout if BOTH tokens are missing:
```typescript
const accessToken = getAccessToken();
const refreshToken = getRefreshToken();

// Only logout if BOTH tokens are missing
if (!accessToken && !refreshToken && user) {
  handleLogout();
}
```

This allows the refresh mechanism to work properly - when the access token expires, as long as the refresh token exists, the user stays logged in and the token is automatically refreshed.

### Issue: Multiple refresh requests

**Cause**: No refresh promise sharing

**Solution**: Already implemented in refresh-token-link.ts with `refreshPromise` variable

### Issue: Infinite refresh loop

**Cause**: Refresh client uses same link chain with 401 interceptor

**Solution**: Create separate client without auth/interceptors (already implemented)

## Future Improvements

1. **Proactive Refresh**: Refresh token before it expires (e.g., at 14 minutes)
2. **Refresh Queue**: Queue failed requests and replay after refresh
3. **Multiple Sessions**: Support refresh across multiple browser tabs
4. **Metrics**: Track refresh success/failure rates

## References

- [tRPC v11 Links Documentation](https://trpc.io/docs/client/links)
- [tRPC Authentication Guide](https://trpc.io/docs/server/authorization)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
