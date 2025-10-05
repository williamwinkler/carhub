import { useState } from "react";
import toast from "react-hot-toast";
import { setAccessToken } from "../../lib/cookies";
import { trpc } from "../_trpc/client";
import { User } from "../_trpc/types";
interface LoginFormProps {
  onLoginSuccess?: (user: User) => void;
  onClose?: () => void;
  standalone?: boolean; // For full-page login vs dropdown
}

export function LoginForm({
  onLoginSuccess,
  onClose,
  standalone = false,
}: LoginFormProps) {
  const login = trpc.auth.login.useMutation();
  const utils = trpc.useUtils();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const result = await login.mutateAsync({ username, password });

      // Store access token in cookie (refresh token is set by API in cookie)
      setAccessToken(result.accessToken);

      // Get user info using utils to fetch fresh data
      const userInfo = await utils.accounts.getMe.fetch();

      // Call success callback if provided
      if (onLoginSuccess) {
        onLoginSuccess(userInfo);
      }

      // Reset form
      setUsername("");
      setPassword("");

      toast.success(`Welcome back, ${userInfo.firstName}!`);

      // Close modal/form if close callback provided
      if (onClose) {
        onClose();
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    }
  }

  return (
    <div
      className={
        standalone
          ? "flex rounded-3xl items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 min-h-screen"
          : "w-full"
      }
    >
      <form
        onSubmit={handleSubmit}
        className={
          standalone
            ? "w-full max-w-sm rounded-xl bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 p-8 shadow-2xl space-y-6"
            : "w-full space-y-4"
        }
      >
        {standalone && (
          <h2 className="mb-8 text-center text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Login
          </h2>
        )}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 text-slate-200 px-4 py-3 text-sm focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-600/50 bg-slate-700/50 text-slate-200 px-4 py-3 text-sm focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
            required
          />
        </div>

        <button
          type="submit"
          disabled={login.isPending}
          className="w-full rounded-lg bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-500 hover:to-purple-500 px-4 py-3 text-white font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed border border-blue-500/30 hover:border-blue-400/50"
        >
          {login.isPending ? "Logging in..." : "Login"}
        </button>

        <div className="mt-6 text-xs text-slate-400 bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
          <p className="font-medium text-slate-300 mb-2">Demo accounts:</p>
          <p>• Admin: admin / admin123</p>
          <p>• User: jane / jane123</p>
          <p>• User: string / string</p>
        </div>
      </form>
    </div>
  );
}
