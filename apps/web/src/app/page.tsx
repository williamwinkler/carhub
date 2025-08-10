"use client";

import { useState } from "react";
import CarForm from "./_components/CarForm";
import CarList, { Car } from "./_components/CarList";

export default function Home() {
  const [editingCar, setEditingCar] = useState<Car | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-300 to-purple-500">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Car Management System
          </h1>
          <p className="text-gray-600">Manage your car inventory with ease</p>
        </div>

        <div className="flex flex-col items-center gap-8">
          <CarForm editingCar={editingCar} onDone={() => setEditingCar(null)} />
          <CarList onEdit={(car) => setEditingCar(car)} />
        </div>
      </div>
    </div>
  );
}
