"use client";

import { useState, useEffect } from "react";
import CarForm from "./_components/CarForm";
import CarList, { Car } from "./_components/CarList";
import Navbar from "./_components/Navbar";
import type { AppRouter } from "@api/modules/trpc/trpc.router";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "./_trpc/client";

type RouterOutput = inferRouterOutputs<AppRouter>;
type User = RouterOutput['auth']['me'];

export default function Home() {
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [currentUser, setCurrentUser] = useState<User | undefined>();

  // Check if user is already logged in on page load
  useEffect(() => {
    const checkAuthState = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const userInfo = await trpc.auth.me.useQuery();
          setCurrentUser(userInfo.data);
        } catch (error) {
          // Token might be expired, clear it
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
    };

    checkAuthState();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={currentUser} onUserChange={setCurrentUser} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Car Management System
          </h1>
          <p className="text-gray-600">Manage your car inventory with ease</p>
        </div>

        <div className="flex flex-col items-center gap-8">
          {currentUser && (
            <CarForm editingCar={editingCar} onDone={() => setEditingCar(null)} />
          )}
          <CarList
            onEdit={(car) => setEditingCar(car)}
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  );
}
