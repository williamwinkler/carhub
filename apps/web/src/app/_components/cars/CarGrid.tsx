"use client";

import { Car } from "../../_trpc/types";
import CarCard from "./CarCard";

interface CarGridProps {
  cars: Car[];
  isLoading: boolean;
  onFavoriteUpdate?: () => void;
}

export default function CarGrid({
  cars,
  isLoading,
  onFavoriteUpdate,
}: CarGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="bg-slate-800/50 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-slate-700 rounded mb-4"></div>
            <div className="h-4 bg-slate-700 rounded mb-2"></div>
            <div className="h-4 bg-slate-700 rounded mb-2"></div>
            <div className="h-8 bg-slate-700 rounded mt-4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl text-slate-600 mb-4">🔍</div>
        <h3 className="text-2xl text-slate-400 mb-2">No cars found</h3>
        <p className="text-slate-500 mb-6">
          Try adjusting your search criteria
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
      {cars.map((car) => (
        <CarCard key={car.id} car={car} onFavoriteUpdate={onFavoriteUpdate} />
      ))}
    </div>
  );
}
