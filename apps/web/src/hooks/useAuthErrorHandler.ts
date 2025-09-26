import { useAuth } from "../lib/auth-context";

export const useAuthErrorHandler = () => {
  const { logout } = useAuth();

  const handleError = (error: unknown) => {
    if (error && typeof error === "object" && "data" in error) {
      const errorData = (error as { data?: { httpStatus?: number } }).data;
      if (errorData?.httpStatus === 401) {
        logout();
      }
    }
  };

  return { handleError };
};
