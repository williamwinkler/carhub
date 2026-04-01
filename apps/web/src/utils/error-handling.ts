/**
 * Centralized error handling utilities
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Logs an error with context information
 */
export function logError(
  error: unknown,
  context?: ErrorContext,
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const logData = {
    message: errorMessage,
    stack: errorStack,
    context: context || {},
    timestamp: new Date().toISOString(),
  };

  // In development, log to console with full details
  if (process.env.NODE_ENV === "development") {
    console.error("Error:", logData);
  } else {
    // In production, you might want to send to an error tracking service
    // e.g., Sentry, LogRocket, etc.
    console.error("Error:", errorMessage, context);
  }

  // TODO: Integrate with error tracking service in production
  // if (process.env.NODE_ENV === "production") {
  //   errorTrackingService.captureException(error, { extra: logData });
  // }
}

/**
 * Formats an error message for display to users
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || "An unexpected error occurred";
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}

/**
 * Checks if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("NetworkError") ||
      error.name === "NetworkError"
    );
  }
  return false;
}

/**
 * Checks if an error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error && typeof error === "object" && "data" in error) {
    const errorData = error as { data?: { httpStatus?: number } };
    return errorData.data?.httpStatus === 401;
  }
  return false;
}

/**
 * Handles errors with appropriate logging and user feedback
 */
export function handleError(
  error: unknown,
  context?: ErrorContext,
  showToast = true,
): void {
  logError(error, context);

  // Only show toast if explicitly requested and not in silent mode
  if (showToast && typeof window !== "undefined") {
    const message = formatErrorMessage(error);
    // Dynamic import to avoid SSR issues
    import("react-hot-toast").then(({ default: toast }) => {
      toast.error(message);
    });
  }
}
