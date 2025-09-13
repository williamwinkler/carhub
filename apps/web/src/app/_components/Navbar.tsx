"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../lib/auth-context";
import { trpc } from "../_trpc/client";

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [hasError, setHasError] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Initialize mutations at component level
  const logoutMutation = trpc.auth.logout.useMutation();
  const loginMutation = trpc.auth.login.useMutation();
  const utils = trpc.useUtils();

  const handleLoginSuccess = (userInfo: any) => {
    login(userInfo);
    setIsLoginOpen(false);
    setUsername("");
    setPassword("");
    setHasError(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasError(false);

    try {
      const result = await loginMutation.mutateAsync({ username, password });

      // Store tokens in cookies
      const { setAccessToken, setRefreshToken } = await import(
        "../../lib/cookies"
      );
      setAccessToken(result.accessToken);
      setRefreshToken(result.refreshToken);

      // Get user info using utils to fetch fresh data
      const userInfo = await utils.auth.me.fetch();

      handleLoginSuccess(userInfo);

      toast.success(`Welcome back, ${userInfo.firstName}!`, {
        duration: 4000,
        style: {
          background: "#1e293b",
          color: "#f1f5f9",
          border: "1px solid #475569",
        },
        iconTheme: {
          primary: "#22c55e",
          secondary: "#1e293b",
        },
      });
    } catch (error: any) {
      setHasError(true);

      // Auto-clear error state after animation
      setTimeout(() => setHasError(false), 3000);
    }
  };

  const closeLogin = () => {
    setIsLoginOpen(false);
    setUsername("");
    setPassword("");
    setHasError(false);
  };

  // Close login on Escape key or click outside
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isLoginOpen) {
        closeLogin();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        formRef.current &&
        !formRef.current.contains(event.target as Node) &&
        isLoginOpen
      ) {
        closeLogin();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLoginOpen]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      logout();
      toast.success("Logged out successfully!");
    } catch (error: any) {
      // Even if logout fails on server, clear local state
      logout();

      // Don't show error toast for 401 - that means we're already logged out
      if (error.data?.httpStatus !== 401) {
        toast.error(error.message || "Logout failed");
      }
    }
  };

  return (
    <nav className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 shadow-xl relative z-[9999]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              CarHub
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            {user && (
              <>
                <a
                  href="#"
                  className="text-slate-300 hover:text-blue-400 transition-colors duration-200 font-medium"
                >
                  My Cars
                </a>
                <a
                  href="#"
                  className="text-slate-300 hover:text-blue-400 transition-colors duration-200 font-medium"
                >
                  Favorites
                </a>
              </>
            )}
          </div>

          {/* User Menu / Login */}
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-slate-300">
                  <span className="text-blue-400 font-medium">
                    {user.username}
                  </span>
                  {user.role === "admin" && (
                    <span className="ml-2 px-3 py-1 bg-gradient-to-r from-green-500/20 to-green-500/20 border border-green-500/30 text-green-400 text-xs rounded-full font-medium">
                      Admin
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 border border-blue-500/30 hover:border-blue-400/50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <form
                ref={formRef}
                onSubmit={handleLogin}
                className="flex items-center space-x-2"
              >
                {/* Username Input - slides in first */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isLoginOpen
                      ? "max-w-[140px] opacity-100"
                      : "max-w-0 opacity-0"
                  }`}
                >
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (hasError) setHasError(false);
                    }}
                    className={`w-[140px] px-3 py-2 text-sm bg-slate-700/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      hasError
                        ? "border border-red-500/70 focus:border-red-400/70 focus:ring-red-400/20"
                        : "border border-slate-600/50 focus:border-blue-400/50 focus:ring-blue-400/20"
                    }`}
                    required={isLoginOpen}
                  />
                </div>

                {/* Password Input - slides in second with delay */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isLoginOpen
                      ? "max-w-[140px] opacity-100 delay-100"
                      : "max-w-0 opacity-0"
                  }`}
                >
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (hasError) setHasError(false);
                    }}
                    className={`w-[140px] px-3 py-2 text-sm bg-slate-700/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      hasError
                        ? "border border-red-500/70 focus:border-red-400/70 focus:ring-red-400/20"
                        : "border border-slate-600/50 focus:border-blue-400/50 focus:ring-blue-400/20"
                    }`}
                    required={isLoginOpen}
                  />
                </div>

                {/* Login Button */}
                <button
                  type={isLoginOpen ? "submit" : "button"}
                  onClick={isLoginOpen ? undefined : () => setIsLoginOpen(true)}
                  disabled={isLoginOpen && loginMutation.isPending}
                  className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 border border-blue-500/30 hover:border-blue-400/50 disabled:opacity-50"
                >
                  {isLoginOpen && loginMutation.isPending ? "..." : "Login"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
