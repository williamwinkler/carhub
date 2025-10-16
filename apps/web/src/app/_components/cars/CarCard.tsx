"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  FaCalendar,
  FaCar,
  FaClock,
  FaHeart,
  FaIndustry,
  FaPalette,
  FaRegHeart,
  FaTachometerAlt,
  FaUser,
} from "react-icons/fa";
import { useAuth } from "../../../lib/auth-context";
import { trpc } from "../../_trpc/client";
import { Car } from "../../_trpc/types";

interface CarCardProps {
  car: Car;
  onFavoriteUpdate?: () => void;
}

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
  return `${Math.ceil(diffDays / 365)} years ago`;
};

export default function CarCard({ car, onFavoriteUpdate }: CarCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [optimisticFavorite, setOptimisticFavorite] = useState(car.isFavorite);

  const toggleFavoriteMutation = trpc.cars.toggleFavorite.useMutation({
    onMutate: () => {
      // Immediately update UI
      setOptimisticFavorite(!optimisticFavorite);
    },
    onSuccess: ({ favorited }) => {
      // Mark queries as stale but don't refetch - prevents list reordering
      // The next time the user navigates or explicitly refreshes, data will be up-to-date
      utils.cars.list.invalidate({ refetchType: 'none' });
      utils.cars.getFavorites.invalidate({ refetchType: 'none' });
      utils.cars.getMyCars.invalidate({ refetchType: 'none' });

      // Update optimistic state to match server response
      setOptimisticFavorite(!favorited);
      onFavoriteUpdate?.();

      if (!favorited) {
        toast.success(
          `Favorited ${car!.model!.manufacturer!.name} ${car?.model?.name}`,
        );
      } else {
        toast.success(
          `Unfavorited ${car!.model!.manufacturer!.name} ${car?.model?.name}`,
        );
      }
    },
    onError: (error) => {
      // Revert optimistic update
      setOptimisticFavorite(car.isFavorite);
      toast.error(error.message || "Failed to update favorite");
    },
  });

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please log in to save favorites");
      return;
    }
    await toggleFavoriteMutation.mutateAsync({ id: car.id });
  };

  const handleCardClick = () => {
    router.push(`/cars/${car.id}`);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden hover:bg-slate-800/70 transition-all duration-200 group relative">
      {/* Favorite Button */}
      {user && (
        <button
          onClick={handleToggleFavorite}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-700/50 transition-all duration-200 z-10 bg-slate-800/80"
          disabled={toggleFavoriteMutation.isPending}
        >
          {optimisticFavorite ? (
            <FaHeart className="w-5 h-5 text-pink-400" />
          ) : (
            <FaRegHeart className="w-5 h-5 text-slate-400 hover:text-pink-400" />
          )}
        </button>
      )}

      <div className="cursor-pointer" onClick={handleCardClick}>
        {/* Header Section */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between pr-12">
            <div>
              <h3 className="text-xl font-bold text-slate-200 group-hover:text-blue-400 transition-colors mb-1">
                {car.model?.manufacturer?.name} {car.model?.name}
              </h3>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <FaIndustry className="w-3 h-3" />
                  <span>{car.model?.manufacturer?.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FaCar className="w-3 h-3" />
                  <span>{car.model?.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="text-3xl font-bold text-green-400 mt-3 mb-4">
            ${car.price?.toLocaleString() || "Contact for price"}
          </div>
        </div>

        {/* Vehicle Details Grid */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 p-2 bg-slate-700/20 rounded">
              <FaCalendar className="w-3 h-3 text-blue-400" />
              <div>
                <p className="text-slate-400 text-xs">Year</p>
                <p className="text-slate-200 font-medium">{car.year}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-slate-700/20 rounded">
              <FaPalette
                className={`w-3 h-3 text-${car.color.toLowerCase()}-400`}
              />
              <div>
                <p className="text-slate-400 text-xs">Color</p>
                <p className="text-slate-200 font-medium">{car.color}</p>
              </div>
            </div>

            {car.kmDriven && (
              <div className="flex items-center gap-2 p-2 bg-slate-700/20 rounded">
                <FaTachometerAlt className="w-3 h-3 text-orange-400" />
                <div>
                  <p className="text-slate-400 text-xs">Distance</p>
                  <p className="text-slate-200 font-medium">
                    {car.kmDriven.toLocaleString()} km
                  </p>
                </div>
              </div>
            )}

            {car.createdBy && (
              <div className="flex items-center gap-2 p-2 bg-slate-700/20 rounded">
                <FaUser className="w-3 h-3 text-slate-400" />
                <div>
                  <p className="text-slate-400 text-xs">Seller</p>
                  <p className="text-slate-200 font-medium text-xs">
                    {car.createdBy.firstName} {car.createdBy.lastName}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seller Info & Posted Date */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-full">
                Private Seller
              </span>
            </div>
            <div className="flex items-center gap-1">
              <FaClock className="w-3 h-3" />
              <span>Listed {formatDate(car.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="px-6 pb-6">
          <button className="w-full py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-400 rounded-lg font-medium hover:from-blue-600/30 hover:to-purple-600/30 hover:border-blue-400/50 transition-all duration-200">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
