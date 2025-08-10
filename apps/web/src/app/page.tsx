"use client";

import { useState } from "react";
import CarForm from "./_components/CarForm";
import CarList from "./_components/CarList";

export default function Home() {
  const [editingCar, setEditingCar] = useState(null);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center gap-8 py-10">
      <CarForm editingCar={editingCar} onDone={() => setEditingCar(null)} />
      <CarList onEdit={(car) => setEditingCar(car)} />
    </div>
  );
}
