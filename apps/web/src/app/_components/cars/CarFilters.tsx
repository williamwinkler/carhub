"use client";

import { FaSearch } from "react-icons/fa";
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
  onSearch: () => void;
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
  onSearch,
  onClearFilters,
}: CarFiltersProps) {
  const manufacturersQuery = trpc.carManufacturers.list.useQuery();
  const modelsQuery = trpc.carModels.list.useQuery(
    selectedManufacturer ? { manufacturerId: selectedManufacturer } : undefined,
    { enabled: !!selectedManufacturer },
  );

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
        {/* Manufacturer Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Make</label>
          <select
            value={selectedManufacturer}
            onChange={(e) => {
              setSelectedManufacturer(e.target.value);
              setSelectedModel(""); // Reset model when manufacturer changes
            }}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Makes</option>
            {manufacturersQuery.data?.items?.map((manufacturer) => (
              <option key={manufacturer.id} value={manufacturer.id}>
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
              <option key={model.id} value={model.id}>
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
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value)}
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
            <option value="">Default</option>
            <option value="price">Price</option>
            <option value="year">Year</option>
            <option value="mileage">Mileage</option>
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
            disabled={!sortBy}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
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
          <div className="flex gap-2">
            <button
              onClick={onSearch}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <FaSearch className="w-3 h-3" />
              Search
            </button>
            <button
              onClick={onClearFilters}
              className="px-3 py-2 bg-slate-600/50 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-all duration-200"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
