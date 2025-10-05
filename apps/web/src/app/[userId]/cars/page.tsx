"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../../lib/auth-context";
import Navbar from "../../_components/Navbar";
import CarGrid from "../../_components/cars/CarGrid";
import Pagination from "../../_components/ui/Pagination";
import { trpc } from "../../_trpc/client";

export default function UserCarsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const limit = 12;
  const utils = trpc.useUtils();

  const userId = params.userId as string;
  const isOwnProfile = user?.id === userId;

  // Get user info to display their name
  const { data: userProfile } = trpc.accounts.getMe.useQuery(undefined, {
    enabled: isOwnProfile,
  });

  // Get user's cars
  const carsQuery = trpc.cars.getMyCars.useQuery(
    { skip: page * limit, limit },
    { enabled: isOwnProfile },
  );

  // For now, we'll only support viewing your own cars
  // You could extend this to allow viewing other users' public cars
  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-slate-400 mb-4">
            Access Denied
          </h1>
          <p className="text-slate-500 mb-8">
            Please log in to view car listings.
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!isOwnProfile) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-slate-400 mb-4">
            Not Available
          </h1>
          <p className="text-slate-500 mb-8">
            Viewing other users&apos; cars is not currently supported.
          </p>
          <Link
            href="/cars"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200"
          >
            Browse All Cars
          </Link>
        </div>
      </div>
    );
  }

  const handleFavoriteUpdate = () => {
    // Refresh both my cars and the general list
    utils.cars.getMyCars.invalidate();
    utils.cars.list.invalidate();
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              My Cars
            </h1>
            <div className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <span className="text-slate-300 text-sm">
                {userProfile?.firstName} {userProfile?.lastName}
              </span>
            </div>
          </div>
          <p className="text-slate-400 text-lg">
            Manage and track your car listings
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            {carsQuery.data?.meta?.totalItems !== undefined && (
              <div className="text-slate-400">
                {carsQuery.data.meta.totalItems} car
                {carsQuery.data.meta.totalItems !== 1 ? "s" : ""} listed
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/cars/create")}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Add New Car
            </button>
            <Link
              href="/cars"
              className="px-6 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-all duration-200"
            >
              Browse All Cars
            </Link>
          </div>
        </div>

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

        {/* Empty State */}
        {!carsQuery.isLoading &&
          (!carsQuery.data?.items || carsQuery.data.items.length === 0) && (
            <div className="text-center py-16">
              <div className="text-6xl text-slate-600 mb-4">🚗</div>
              <h3 className="text-2xl text-slate-400 mb-2">
                No cars listed yet
              </h3>
              <p className="text-slate-500 mb-8">
                Start building your car inventory by adding your first listing
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push("/cars/create")}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  Add Your First Car
                </button>
                <Link
                  href="/cars"
                  className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-all duration-200"
                >
                  Browse Other Cars
                </Link>
              </div>
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
