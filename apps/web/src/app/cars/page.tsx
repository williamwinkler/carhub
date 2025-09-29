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

  useEffect(() => {
    const manufacturer = searchParams.get("manufacturer");
    const model = searchParams.get("model");
    const color = searchParams.get("color");
    const sortByParam = searchParams.get("sortBy");
    const pageParam = searchParams.get("page");

    if (manufacturer !== null) setSelectedManufacturer(manufacturer);
    if (model !== null) setSelectedModel(model);
    if (color !== null) setColorFilter(color);
    if (sortByParam !== null) setSortBy(sortByParam);
    if (pageParam !== null) setPage(parseInt(pageParam, 10));
  }, [searchParams]);

  // Build search params for cars
  const carsQueryParams = {
    skip: page * limit,
    limit,
    ...(selectedManufacturer && { manufacturerSlug: selectedManufacturer }),
    ...(selectedModel && { modelSlug: selectedModel }),
    ...(colorFilter && { color: colorFilter }),
    sortBy: sortBy ?? "createdAt",
  };

  const carsQuery = trpc.cars.list.useQuery(carsQueryParams);
  const utils = trpc.useUtils();

  const updateURL = (params: {
    manufacturer?: string;
    model?: string;
    color?: string;
    sortBy?: string;
    page?: number;
  }) => {
    const urlParams = new URLSearchParams();

    if (params.manufacturer) urlParams.set("manufacturer", params.manufacturer);
    if (params.model) urlParams.set("model", params.model);
    if (params.color) urlParams.set("color", params.color);
    if (params.sortBy && params.sortBy !== "createdAt")
      urlParams.set("sortBy", params.sortBy);
    if (params.page && params.page > 0)
      urlParams.set("page", params.page.toString());

    const queryString = urlParams.toString();
    router.push(`/cars${queryString ? `?${queryString}` : ""}`); // FIXME: better way?
  };

  // Update URL whenever filters change
  useEffect(() => {
    updateURL({
      manufacturer: selectedManufacturer,
      model: selectedModel,
      color: colorFilter,
      sortBy,
      page,
    });
  }, [selectedManufacturer, selectedModel, colorFilter, sortBy, page]);

  const handleClearFilters = () => {
    setSelectedManufacturer("");
    setSelectedModel("");
    setColorFilter("");
    setSortBy("createdAt");
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
          setSelectedManufacturer={(value) => {
            setSelectedManufacturer(value);
            setSelectedModel(""); // Reset model when manufacturer changes
            setPage(0); // Reset page
          }}
          selectedModel={selectedModel}
          setSelectedModel={(value) => {
            setSelectedModel(value);
            setPage(0); // Reset page
          }}
          colorFilter={colorFilter}
          setColorFilter={(value) => {
            setColorFilter(value);
            setPage(0); // Reset page
          }}
          sortBy={sortBy}
          setSortBy={(value) => {
            setSortBy(value);
            setPage(0); // Reset page
          }}
          sortDirection={sortDirection}
          setSortDirection={setSortDirection}
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
