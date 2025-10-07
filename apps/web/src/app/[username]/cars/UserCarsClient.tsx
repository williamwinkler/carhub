"use client";

import Link from "next/link";
import { parseAsInteger, useQueryStates } from "nuqs";
import { useCallback } from "react";
import CarGrid from "../../_components/cars/CarGrid";
import Pagination from "../../_components/ui/Pagination";
import { trpc } from "../../_trpc/client";
import type { Car } from "../../_trpc/types";

const LIMIT = 12;

interface UserCarsClientProps {
  userId: string;
  profileUser: {
    firstName: string;
    lastName: string;
    username: string;
  };
  isOwnProfile: boolean;
  initialCars: Car[];
  totalItems: number;
  currentUser: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  } | null;
}

export default function UserCarsClient({
  userId,
  profileUser,
  isOwnProfile,
  initialCars,
  totalItems,
  currentUser,
}: UserCarsClientProps) {
  const [{ page }, setQuery] = useQueryStates(
    {
      page: parseAsInteger.withDefault(0),
    },
    {
      clearOnDefault: true,
      shallow: true,
      history: "push",
    },
  );

  // Shared query options
  const queryOptions = {
    ...(page === 0 &&
      initialCars.length > 0 && {
        initialData: {
          items: initialCars,
          meta: { totalItems },
        } as any,
      }),
  };

  // Conditional query registration - only register the query we actually need
  const { data: carsData, isLoading: carsLoading } = isOwnProfile
    ? trpc.cars.getMyCars.useQuery(
        {
          skip: page * LIMIT,
          limit: LIMIT,
        },
        queryOptions,
      )
    : trpc.cars.getCarsByUserId.useQuery(
        {
          userId,
          skip: page * LIMIT,
          limit: LIMIT,
        },
        queryOptions,
      );

  const handleSetPage = useCallback(
    (p: number) => setQuery({ page: Math.max(0, p) }),
    [setQuery],
  );

  const utils = trpc.useUtils();
  const handleFavoriteUpdate = useCallback(() => {
    if (isOwnProfile) {
      utils.cars.getMyCars.invalidate();
    } else {
      utils.cars.getCarsByUserId.invalidate();
    }
  }, [isOwnProfile, utils.cars.getMyCars, utils.cars.getCarsByUserId]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {isOwnProfile ? "My Cars" : `${profileUser.firstName}'s Cars`}
          </h1>
          <div className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
            <span className="text-slate-300 text-sm">
              {profileUser.firstName} {profileUser.lastName}
            </span>
          </div>
        </div>
        <p className="text-slate-400 text-lg">
          {isOwnProfile
            ? "Manage and track your car listings"
            : `Browse cars listed by @${profileUser.username}`}
        </p>
      </div>

      {typeof carsData?.meta?.totalItems === "number" && (
        <div className="text-slate-400 mb-8">
          {carsData.meta.totalItems} car
          {carsData.meta.totalItems !== 1 ? "s" : ""} listed
        </div>
      )}

      {carsData?.items?.length ? (
        <>
          <p className="text-slate-400 mb-6">
            Showing {carsData.items.length} of {carsData.meta.totalItems} cars
          </p>
          <CarGrid
            cars={carsData.items}
            isLoading={carsLoading}
            onFavoriteUpdate={handleFavoriteUpdate}
          />
        </>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl text-slate-600 mb-4">🚗</div>
          <h3 className="text-2xl text-slate-400 mb-2">No cars listed yet</h3>
          <p className="text-slate-500 mb-8">
            {isOwnProfile
              ? "Start building your car inventory by adding your first listing"
              : `${profileUser.firstName} hasn't listed any cars yet`}
          </p>
          {isOwnProfile ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/cars/create"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                Add Your First Car
              </Link>
              <Link
                href="/cars"
                className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-all duration-200"
              >
                Browse Other Cars
              </Link>
            </div>
          ) : (
            <Link
              href="/cars"
              className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-all duration-200"
            >
              Browse All Cars
            </Link>
          )}
        </div>
      )}

      {carsData && (
        <Pagination
          currentPage={page}
          totalItems={carsData.meta.totalItems}
          itemsPerPage={LIMIT}
          onPageChange={handleSetPage}
        />
      )}
    </div>
  );
}
