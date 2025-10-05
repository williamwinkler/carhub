"use client";

import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { Suspense, useCallback } from "react";
import Navbar from "../_components/Navbar";
import CarFilters from "../_components/cars/CarFilters";
import CarGrid from "../_components/cars/CarGrid";
import Pagination from "../_components/ui/Pagination";
import { trpc } from "../_trpc/client";

const LIMIT = 12;

function CarsPageContent() {
  const [{ manufacturer, model, color, sortBy, sortDirection, page }, setQuery] =
    useQueryStates(
      {
        manufacturer: parseAsString.withDefault(""),
        model: parseAsString.withDefault(""),
        color: parseAsString.withDefault(""),
        sortBy: parseAsString.withDefault("createdAt"),
        sortDirection: parseAsString.withDefault("desc"),
        page: parseAsInteger.withDefault(0),
      },
      {
        clearOnDefault: true,
        shallow: true,
        history: "push",
      },
    );

  // Prevent no-op writes that can cause loops in certain child patterns
  const apply = useCallback(
    (
      patch: Partial<{
        manufacturer: string;
        model: string;
        color: string;
        sortBy: string;
        sortDirection: string;
        page: number;
      }>,
    ) => {
      const next = {
        manufacturer,
        model,
        color,
        sortBy,
        sortDirection,
        page,
        ...patch,
      };
      if (
        next.manufacturer === manufacturer &&
        next.model === model &&
        next.color === color &&
        next.sortBy === sortBy &&
        next.sortDirection === sortDirection &&
        next.page === page
      ) {
        return;
      }
      setQuery(patch);
    },
    [manufacturer, model, color, sortBy, sortDirection, page, setQuery],
  );

  // Stable handlers
  const handleSetManufacturer = useCallback(
    (v: string) => apply({ manufacturer: v, model: "", page: 0 }),
    [apply],
  );
  const handleSetModel = useCallback(
    (v: string) => apply({ model: v, page: 0 }),
    [apply],
  );
  const handleSetColor = useCallback(
    (v: string) => apply({ color: v, page: 0 }),
    [apply],
  );
  const handleSetSortBy = useCallback(
    (v: string) => apply({ sortBy: v || "createdAt", page: 0 }),
    [apply],
  );
  const handleSetSortDirection = useCallback(
    (v: string) => apply({ sortDirection: v }),
    [apply],
  );
  const handleSetPage = useCallback(
    (p: number) => apply({ page: Math.max(0, p) }),
    [apply],
  );
  const handleClear = useCallback(
    () =>
      setQuery({
        manufacturer: "",
        model: "",
        color: "",
        sortBy: "createdAt",
        sortDirection: "desc",
        page: 0,
      }),
    [setQuery],
  );

  const carsQuery = trpc.cars.list.useQuery({
    skip: page * LIMIT,
    limit: LIMIT,
    ...(manufacturer && { manufacturerSlug: manufacturer }),
    ...(model && { modelSlug: model }),
    ...(color && { color }),
    sortBy: (sortBy as any) || "createdAt",
    sortDirection: (sortDirection as any) || "desc",
  });

  const utils = trpc.useUtils();
  const handleFavoriteUpdate = useCallback(() => {
    utils.cars.list.invalidate();
  }, [utils.cars.list]);

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
          selectedManufacturer={manufacturer}
          setSelectedManufacturer={handleSetManufacturer}
          selectedModel={model}
          setSelectedModel={handleSetModel}
          colorFilter={color}
          setColorFilter={handleSetColor}
          sortBy={sortBy}
          setSortBy={handleSetSortBy}
          sortDirection={sortDirection}
          setSortDirection={handleSetSortDirection}
          onClearFilters={handleClear}
        />

        {/* Results Count */}
        {carsQuery.data?.items?.length ? (
          <div className="mb-6">
            <p className="text-slate-400">
              Showing {carsQuery.data.items.length} of{" "}
              {carsQuery.data.meta.totalItems} cars
            </p>
          </div>
        ) : null}

        {/* Cars Grid */}
        <CarGrid
          cars={carsQuery.data?.items || []}
          isLoading={carsQuery.isLoading}
          onFavoriteUpdate={handleFavoriteUpdate}
        />

        {/* No Results */}
        {!carsQuery.isLoading && !carsQuery.data?.items?.length && (
          <div className="text-center py-16">
            <button
              onClick={handleClear}
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
            itemsPerPage={LIMIT}
            onPageChange={handleSetPage}
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
