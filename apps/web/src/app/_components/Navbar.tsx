"use client";

import type { AppRouter } from "@api/modules/trpc/trpc.router";
import type { inferRouterOutputs } from "@trpc/server";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "../_trpc/client";

type RouterOutput = inferRouterOutputs<AppRouter>;
type User = RouterOutput["auth"]["me"];

interface NavbarProps {
  user?: User;
  onUserChange: (user?: User) => void;
}

export default function Navbar({ user, onUserChange }: NavbarProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleLogin", credentials);
    setIsLoading(true);

    console.log("credentials", credentials);

    try {
      console.log("mutating");
      const result = await trpc.auth.login.useMutation().mutateAsync(credentials);

      console.log("result", result);
      // Store tokens in localStorage
      localStorage.setItem("accessToken", result.accessToken);
      localStorage.setItem("refreshToken", result.refreshToken);

      // Get user info
      const userInfo = await trpc.auth.me.useQuery();
      onUserChange(userInfo.data);

      setIsLoginOpen(false);
      setCredentials({ username: "", password: "" });
      toast.success("Logged in successfully!");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await trpc.auth.logout.useMutation().mutateAsync();
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      onUserChange(undefined);
      toast.success("Logged out successfully!");
    } catch (error: any) {
      // Even if logout fails on server, clear local tokens
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      onUserChange(undefined);
      toast.error(error.message || "Logout failed");
    }
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-800">CarHub</h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-600 hover:text-gray-900">
              All Cars
            </a>
            {user && (
              <>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  My Cars
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  Favorites
                </a>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  Welcome, {user.firstName}!
                  {user.role === "admin" && (
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      Admin
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsLoginOpen(!isLoginOpen)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </button>

                {/* Login Dropdown */}
                {isLoginOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 border">
                    <form onSubmit={handleLogin} className="p-4 space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Sign In
                      </h3>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Username
                        </label>
                        <input
                          type="text"
                          value={credentials.username}
                          onChange={(e) =>
                            setCredentials({
                              ...credentials,
                              username: e.target.value,
                            })
                          }
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter username"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Password
                        </label>
                        <input
                          type="password"
                          value={credentials.password}
                          onChange={(e) =>
                            setCredentials({
                              ...credentials,
                              password: e.target.value,
                            })
                          }
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter password"
                          required
                        />
                      </div>

                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md font-medium disabled:opacity-50"
                        >
                          {isLoading ? "Signing in..." : "Sign In"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsLoginOpen(false)}
                          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-md font-medium"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="text-xs text-gray-500 mt-2">
                        <p>Demo accounts:</p>
                        <p>• Admin: admin / admin123</p>
                        <p>• User: jane / jane123</p>
                        <p>• User: string / string</p>
                      </div>
                    </form>
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
