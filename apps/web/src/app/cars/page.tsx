"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Navbar from "../_components/Navbar";
import CarFilters from "../_components/cars/CarFilters";
import CarGrid from "../_components/cars/CarGrid";
import Pagination from "../_components/ui/Pagination";
import { trpc } from "../_trpc/client";

function CarsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search state
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  // Pagination
  const [page, setPage] = useState(0);
  const limit = 12;

  // Initialize from URL params
  const manufacturersQuery = trpc.carManufacturers.list.useQuery();

  useEffect(() => {
    if (!manufacturersQuery.data) return;

    const manufacturer = searchParams.get("manufacturer");
    const modelId = searchParams.get("modelId");
    const color = searchParams.get("color");

    if (manufacturer) {
      // Find manufacturer by name
      const foundManufacturer = manufacturersQuery.data.items?.find(
        (m) => m.name.toLowerCase() === manufacturer.toLowerCase(),
      );
      if (foundManufacturer) {
        setSelectedManufacturer(foundManufacturer.id);
      }
    }
    if (modelId) setSelectedModel(modelId);
    if (color) setColorFilter(color);
  }, [searchParams, manufacturersQuery.data]);

  // Build search params for cars
  const carsQueryParams = {
    skip: page * limit,
    limit,
    ...(selectedModel && { modelId: selectedModel }),
    ...(colorFilter && { color: colorFilter }),
  };

  const carsQuery = trpc.cars.list.useQuery(carsQueryParams);
  const utils = trpc.useUtils();

  const handleSearch = () => {
    setPage(0);
    utils.cars.list.invalidate();
  };

  const handleClearFilters = () => {
    setSelectedManufacturer("");
    setSelectedModel("");
    setColorFilter("");
    setSortBy("");
    setSortDirection("asc");
    setPage(0);
    router.push("/cars");
  };

  const handleFavoriteUpdate = () => {
    utils.cars.list.invalidate();
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Browse Cars
          </h1>
          <p className="text-slate-400 text-lg">
            Find your perfect vehicle from our extensive collection
          </p>
        </div>

        {/* Filters */}
        <CarFilters
          selectedManufacturer={selectedManufacturer}
          setSelectedManufacturer={setSelectedManufacturer}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          colorFilter={colorFilter}
          setColorFilter={setColorFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortDirection={sortDirection}
          setSortDirection={setSortDirection}
          onSearch={handleSearch}
          onClearFilters={handleClearFilters}
        />

        {/* Results Count */}
        {carsQuery.data?.items && carsQuery.data.items.length > 0 && (
          <div className="mb-6">
            <p className="text-slate-400">
              Showing {carsQuery.data.items.length} of{" "}
              {carsQuery.data.meta.totalItems} cars
            </p>
          </div>
        )}

        {/* Cars Grid */}
        <CarGrid
          cars={carsQuery.data?.items || []}
          isLoading={carsQuery.isLoading}
          onFavoriteUpdate={handleFavoriteUpdate}
        />

        {/* No Results State with Clear Button */}
        {!carsQuery.isLoading &&
          (!carsQuery.data?.items || carsQuery.data.items.length === 0) && (
            <div className="text-center py-16">
              <button
                onClick={handleClearFilters}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200"
              >
                Clear All Filters
              </button>
            </div>
          )}

        {/* Pagination */}
        {carsQuery.data && (
          <Pagination
            currentPage={page}
            totalItems={carsQuery.data.meta.totalItems}
            itemsPerPage={limit}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}

export default function CarsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center text-slate-400">Loading...</div>
          </div>
        </div>
      }
    >
      <CarsPageContent />
    </Suspense>
  );
}
