"use client";

import CarList from "./_components/CarList";
import Navbar from "./_components/Navbar";
import { useAuth } from "../lib/auth-context";

export default function Home() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Car Management System
          </h1>
          <p className="text-slate-400 text-lg">Manage your car inventory with elegance</p>
        </div>

        <div className="flex flex-col items-center gap-8">
          <CarList />
        </div>
      </div>
    </div>
  );
}
