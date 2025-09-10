"use client";

import { useState, useEffect } from "react";
import CarList, { Car } from "./_components/CarList";
import Navbar from "./_components/Navbar";
import type { AppRouter } from "@api/modules/trpc/trpc.router";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "./_trpc/client";
import { getAccessToken, removeAuthTokens } from "../lib/cookies";

type RouterOutput = inferRouterOutputs<AppRouter>;
type User = RouterOutput['auth']['me'];

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const utils = trpc.useUtils();

  // Check if user is already logged in on page load
  useEffect(() => {
    const checkAuthState = async () => {
      // Clear any existing localStorage tokens (migration from old implementation)
      if (typeof window !== 'undefined') {
        if (localStorage.getItem('accessToken') || localStorage.getItem('refreshToken')) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }

      const token = getAccessToken();
      if (token) {
        try {
          const userInfo = await utils.auth.me.fetch();
          setCurrentUser(userInfo);
        } catch (error) {
          // Token might be expired, clear cookies
          removeAuthTokens();
          setCurrentUser(undefined);
        }
      }
    };

    checkAuthState();
  }, [utils]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <Navbar user={currentUser} onUserChange={setCurrentUser} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Car Management System
          </h1>
          <p className="text-slate-400 text-lg">Manage your car inventory with elegance</p>
        </div>

        <div className="flex flex-col items-center gap-8">
          <CarList
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  );
}
