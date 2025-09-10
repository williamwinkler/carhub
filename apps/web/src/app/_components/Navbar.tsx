"use client";

import type { AppRouter } from "@api/modules/trpc/trpc.router";
import type { inferRouterOutputs } from "@trpc/server";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "../_trpc/client";
import { removeAuthTokens } from "../../lib/cookies";
import { LoginForm } from "./Login";

type RouterOutput = inferRouterOutputs<AppRouter>;
type User = RouterOutput["auth"]["me"];

interface NavbarProps {
  user?: User;
  onUserChange: (user?: User) => void;
}

export default function Navbar({ user, onUserChange }: NavbarProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Initialize mutations at component level
  const logoutMutation = trpc.auth.logout.useMutation();
  const utils = trpc.useUtils();

  const handleLoginSuccess = (userInfo: User) => {
    onUserChange(userInfo);
    setIsLoginOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();

      // Clear cookies and user state
      removeAuthTokens();
      onUserChange(undefined);

      // Clear all cached queries to ensure fresh state
      utils.invalidate();

      toast.success("Logged out successfully!");
    } catch (error: any) {
      // Even if logout fails on server, clear local tokens and state
      removeAuthTokens();
      onUserChange(undefined);

      // Clear all cached queries to ensure fresh state
      utils.invalidate();

      toast.error(error.message || "Logout failed");
    }
  };

  return (
    <nav className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">CarHub</h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <a href="#" className="text-slate-300 hover:text-blue-400 transition-colors duration-200 font-medium">
              All Cars
            </a>
            {user && (
              <>
                <a href="#" className="text-slate-300 hover:text-blue-400 transition-colors duration-200 font-medium">
                  My Cars
                </a>
                <a href="#" className="text-slate-300 hover:text-blue-400 transition-colors duration-200 font-medium">
                  Favorites
                </a>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-slate-300">
                  <span className="text-blue-400 font-medium">{user.username}</span>
                  {user.role === "admin" && (
                    <span className="ml-2 px-3 py-1 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 text-red-400 text-xs rounded-full font-medium">
                      Admin
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-500 hover:to-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 border border-red-500/30 hover:border-red-400/50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsLoginOpen(!isLoginOpen)}
                  className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 border border-blue-500/30 hover:border-blue-400/50"
                >
                  Login
                </button>

                {/* Login Dropdown */}
                {isLoginOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-2xl z-[100] border border-slate-700/50">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium text-slate-200">
                          Sign In
                        </h3>
                        <button
                          onClick={() => setIsLoginOpen(false)}
                          className="text-slate-400 hover:text-slate-200 cursor-pointer transition-colors duration-200"
                        >
                          ✕
                        </button>
                      </div>
                      <LoginForm
                        onLoginSuccess={handleLoginSuccess}
                        onClose={() => setIsLoginOpen(false)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
