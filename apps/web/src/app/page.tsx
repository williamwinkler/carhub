"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "./_trpc/client";
import { useAuth } from "../lib/auth-context";
import Navbar from "./_components/Navbar";

export default function Home() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  // Fetch manufacturers and models
  const { data: manufacturers, isLoading: manufacturersLoading } = trpc.carManufacturers.list.useQuery();
  const { data: models, isLoading: modelsLoading } = trpc.carModels.list.useQuery(
    selectedManufacturer ? { manufacturerId: selectedManufacturer } : undefined,
    { enabled: !!selectedManufacturer }
  );

  // Fetch some random cars to showcase
  const { data: featuredCars, isLoading: carsLoading } = trpc.cars.list.useQuery({
    limit: 6,
    skip: 0
  });

  const handleSearch = () => {
    const searchParams = new URLSearchParams();
    if (selectedManufacturer) {
      // Find the manufacturer to get its name for the URL
      const manufacturer = manufacturers?.items?.find(m => m.id === selectedManufacturer);
      if (manufacturer) searchParams.set('manufacturer', manufacturer.name);
    }
    if (selectedModel) {
      searchParams.set('modelId', selectedModel);
    }
    router.push(`/cars?${searchParams.toString()}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
              Find Your Perfect Car
            </h1>
            <p className="text-slate-300 text-lg sm:text-xl max-w-3xl mx-auto mb-12">
              Discover thousands of quality vehicles from trusted sellers. Search by make, model, and find the car that fits your lifestyle.
            </p>
          </div>

          {/* Search Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 sm:p-8">
              <h2 className="text-2xl font-semibold text-slate-200 mb-6 text-center">Start Your Search</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {/* Manufacturer Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Make</label>
                  <select
                    value={selectedManufacturer}
                    onChange={(e) => {
                      setSelectedManufacturer(e.target.value);
                      setSelectedModel(""); // Reset model when manufacturer changes
                    }}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  >
                    <option value="">Select a make</option>
                    {manufacturers?.items?.map((manufacturer) => (
                      <option key={manufacturer.id} value={manufacturer.id}>
                        {manufacturer.name}
                      </option>
                    ))}
                  </select>
                  {manufacturersLoading && <div className="text-xs text-slate-400">Loading makes...</div>}
                </div>

                {/* Model Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={!selectedManufacturer}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select a model</option>
                    {models?.items?.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                  {modelsLoading && <div className="text-xs text-slate-400">Loading models...</div>}
                </div>

                {/* Search Button */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 opacity-0">Search</label>
                  <button
                    onClick={handleSearch}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    Search Cars
                  </button>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => router.push('/cars')}
                  className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-4"
                >
                  Or browse all cars
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section className="py-16 bg-slate-800/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-200 mb-4">Featured Vehicles</h2>
            <p className="text-slate-400 text-lg">Check out these amazing cars available right now</p>
          </div>

          {carsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-slate-800/50 rounded-lg p-6 animate-pulse">
                  <div className="h-6 bg-slate-700 rounded mb-4"></div>
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-8 bg-slate-700 rounded mt-4"></div>
                </div>
              ))}
            </div>
          ) : featuredCars?.items && featuredCars.items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCars.items.map((car) => (
                <div
                  key={car.id}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6 hover:bg-slate-800/70 transition-all duration-200 cursor-pointer group"
                  onClick={() => router.push(`/cars/${car.id}`)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                      {car.model.manufacturer.name} {car.model.name}
                    </h3>
                    <span className="text-2xl font-bold text-green-400">${car.price?.toLocaleString()}</span>
                  </div>

                  <div className="space-y-2 text-slate-400">
                    <div className="flex justify-between">
                      <span>Year:</span>
                      <span className="text-slate-300">{car.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Color:</span>
                      <span className="text-slate-300">{car.color}</span>
                    </div>
                    {car.kmDriven && (
                      <div className="flex justify-between">
                        <span>Mileage:</span>
                        <span className="text-slate-300">{car.kmDriven.toLocaleString()} km</span>
                      </div>
                    )}
                  </div>

                  <button className="w-full mt-4 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-400 rounded-lg font-medium hover:from-blue-600/30 hover:to-purple-600/30 transition-all duration-200">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl text-slate-600 mb-4">🚗</div>
              <h3 className="text-xl text-slate-400 mb-2">No cars available yet</h3>
              <p className="text-slate-500">Check back soon for amazing deals!</p>
            </div>
          )}

          <div className="text-center mt-12">
            <button
              onClick={() => router.push('/cars')}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              View All Cars
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
