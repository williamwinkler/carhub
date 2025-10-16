"use client";

import { useAuth } from "../../lib/auth-context";
import Link from "next/link";
import { useState } from "react";
import { FaHeart } from "react-icons/fa";
import CarGrid from "../_components/cars/CarGrid";
import Pagination from "../_components/ui/Pagination";
import { trpc } from "../_trpc/client";

export default function UserFavoritesPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const limit = 12;
  const utils = trpc.useUtils();

  // Get user info to display their name
  const { data: userProfile } = trpc.accounts.getMe.useQuery(undefined, {
    enabled: !!user,
  });

  // Get user's favorite cars
  const favoritesQuery = trpc.cars.getFavorites.useQuery(
    { skip: page * limit, limit },
    { enabled: !!user },
  );

  // Only allow viewing your own favorites for privacy
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-slate-400 mb-4">
          Access Denied
        </h1>
        <p className="text-slate-500 mb-8">
          Please log in to view your favorites.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200"
        >
          Go Home
        </Link>
      </div>
    );
  }

  const handleFavoriteUpdate = () => {
    // Refresh the favorites list when favorites are updated
    utils.cars.getFavorites.invalidate();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
              <FaHeart className="w-10 h-10 text-pink-400" />
              My Favorites
            </h1>
            <div className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <span className="text-slate-300 text-sm">
                {userProfile?.firstName} {userProfile?.lastName}
              </span>
            </div>
          </div>
          <p className="text-slate-400 text-lg">
            Cars you&apos;ve saved for later viewing
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            {favoritesQuery.data?.meta?.totalItems !== undefined && (
              <div className="text-slate-400 flex items-center gap-2">
                <FaHeart className="w-4 h-4 text-pink-400" />
                {favoritesQuery.data.meta.totalItems} favorite
                {favoritesQuery.data.meta.totalItems !== 1 ? "s" : ""} saved
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/cars"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              Browse More Cars
            </Link>
          </div>
        </div>

        {/* Results Count */}
        {favoritesQuery.data?.items && favoritesQuery.data.items.length > 0 && (
          <div className="mb-6">
            <p className="text-slate-400">
              Showing {favoritesQuery.data.items.length} of{" "}
              {favoritesQuery.data.meta.totalItems} favorites
            </p>
          </div>
        )}

        {/* Cars Grid */}
        <CarGrid
          cars={favoritesQuery.data?.items || []}
          isLoading={favoritesQuery.isLoading}
          onFavoriteUpdate={handleFavoriteUpdate}
        />

        {/* Empty State */}
        {!favoritesQuery.isLoading &&
          (!favoritesQuery.data?.items ||
            favoritesQuery.data.items.length === 0) && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">
                <FaHeart className="w-16 h-16 text-slate-600 mx-auto" />
              </div>
              <h3 className="text-2xl text-slate-400 mb-2">No favorites yet</h3>
              <p className="text-slate-500 mb-8">
                Start exploring cars and save the ones you like for easy access
                later
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/cars"
                  className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2 justify-center"
                >
                  <FaHeart className="w-4 h-4" />
                  Discover Cars to Love
                </Link>
              </div>
              <div className="mt-8 p-6 bg-slate-800/30 border border-slate-700/50 rounded-lg max-w-md mx-auto">
                <h4 className="text-slate-300 font-medium mb-2">💡 Pro Tip</h4>
                <p className="text-slate-400 text-sm">
                  Click the heart icon on any car while browsing to add it to
                  your favorites list
                </p>
              </div>
            </div>
          )}

        {/* Pagination */}
        {favoritesQuery.data && (
          <Pagination
            currentPage={page}
            totalItems={favoritesQuery.data.meta.totalItems}
            itemsPerPage={limit}
            onPageChange={setPage}
          />
        )}
      </div>
  );
}
