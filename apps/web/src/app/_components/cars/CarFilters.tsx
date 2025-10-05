"use client";

import { useEffect, useRef, useState } from "react";
import { useDebounce } from "../../../hooks/useDebounce";
import { trpc } from "../../_trpc/client";

interface CarFiltersProps {
  selectedManufacturer: string;
  setSelectedManufacturer: (value: string) => void;
  selectedModel: string;
  setSelectedModel: (value: string) => void;
  colorFilter: string;
  setColorFilter: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortDirection: string;
  setSortDirection: (value: string) => void;
  onClearFilters: () => void;
}

export default function CarFilters({
  selectedManufacturer,
  setSelectedManufacturer,
  selectedModel,
  setSelectedModel,
  colorFilter,
  setColorFilter,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  onClearFilters,
}: CarFiltersProps) {
  // Local state for color input to debounce
  const [localColorFilter, setLocalColorFilter] = useState(colorFilter);
  const debouncedColorFilter = useDebounce(localColorFilter, 200);
  const prevDebouncedRef = useRef(colorFilter);

  // Update parent when debounced value changes (only if different from previous)
  useEffect(() => {
    if (debouncedColorFilter !== prevDebouncedRef.current) {
      prevDebouncedRef.current = debouncedColorFilter;
      setColorFilter(debouncedColorFilter);
    }
  }, [debouncedColorFilter, setColorFilter]);

  // Sync local state when parent state changes (e.g., clear filters)
  useEffect(() => {
    setLocalColorFilter(colorFilter);
    prevDebouncedRef.current = colorFilter;
  }, [colorFilter]);

  const manufacturersQuery = trpc.carManufacturers.list.useQuery(undefined, {
    staleTime: "static",
  });
  const modelsQuery = trpc.carModels.list.useQuery(
    { manufacturerSlug: selectedManufacturer },
    { enabled: !!selectedManufacturer, staleTime: "static" },
  );

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
        {/* Manufacturer Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Make</label>
          <select
            value={selectedManufacturer}
            onChange={(e) => setSelectedManufacturer(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Makes</option>
            {manufacturersQuery.data?.items?.map((manufacturer) => (
              <option key={manufacturer.id} value={manufacturer.slug}>
                {manufacturer.name}
              </option>
            ))}
          </select>
        </div>

        {/* Model Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Model</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={!selectedManufacturer}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
          >
            <option value="">All Models</option>
            {modelsQuery.data?.items?.map((model) => (
              <option key={model.id} value={model.slug}>
                {model.name}
              </option>
            ))}
          </select>
        </div>

        {/* Color Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Color</label>
          <input
            type="text"
            value={localColorFilter}
            onChange={(e) => setLocalColorFilter(e.target.value)}
            placeholder="Any color"
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-400"
          />
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="createdAt">Default (Newest)</option>
            <option value="price">Price</option>
            <option value="year">Year</option>
            <option value="kmDriven">Mileage</option>
          </select>
        </div>

        {/* Sort Direction */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Direction
          </label>
          <select
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 opacity-0">
            Actions
          </label>
          <button
            onClick={onClearFilters}
            className="w-full px-3 py-2 bg-slate-600/50 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-all duration-200"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
