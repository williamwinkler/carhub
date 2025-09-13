import { useAuth } from "../lib/auth-context";

export const useAuthErrorHandler = () => {
  const { logout } = useAuth();

  const handleError = (error: any) => {
    if (error.data?.httpStatus === 401) {
      logout();
    }
  };

  return { handleError };
};
