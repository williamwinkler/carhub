"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaCalendar,
  FaCar,
  FaHeart,
  FaIndustry,
  FaPalette,
  FaRegHeart,
  FaTachometerAlt,
  FaUser,
} from "react-icons/fa";
import { useAuth } from "../../../lib/auth-context";
import Navbar from "../../_components/Navbar";
import { trpc } from "../../_trpc/client";
import { use } from "react";
import { Car } from "../../_trpc/types";

type CarDetailPageProps = {
  params: Promise<{
    id: Car["id"];
  }>;
};

export default function CarDetailPage({ params }: CarDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const carQuery = trpc.cars.getById.useQuery({ id });

  const toggleFavoriteMutation = trpc.cars.toggleFavorite.useMutation({
    onSuccess: () => {
      utils.cars.getById.invalidate({ id });
      utils.cars.list.invalidate();
      utils.cars.getFavorites.invalidate();
      toast.success("Favorite updated!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update favorite");
    },
  });

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Please log in to save favorites");
      return;
    }
    await toggleFavoriteMutation.mutateAsync({ id });
  };

  const handleBack = () => {
    router.back();
  };

  if (carQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-8 animate-pulse">
            <div className="h-8 bg-slate-700 rounded mb-4"></div>
            <div className="h-4 bg-slate-700 rounded mb-2"></div>
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (carQuery.error || !carQuery.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-red-500/20 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              Car Not Found
            </h1>
            <p className="text-slate-400 mb-6">
              {carQuery.error?.message ||
                "The car you're looking for doesn't exist or has been removed."}
            </p>
            <button
              onClick={handleBack}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const car = carQuery.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-slate-400 hover:text-blue-400 mb-6 transition-colors duration-200"
        >
          <FaArrowLeft className="w-4 h-4" />
          Back to Cars
        </button>

        {/* Car Details Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-slate-700/50">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {car.model?.manufacturer?.name} {car.model?.name}
                </h1>
                <p className="text-slate-400 text-lg">
                  {car.year} • {car.color}
                </p>

                {/* Manufacturer & Model Info */}
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <FaIndustry className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-slate-300">
                      Manufacturer:{" "}
                      <span className="text-blue-400 font-medium">
                        {car.model?.manufacturer?.name}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCar className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-slate-300">
                      Model:{" "}
                      <span className="text-purple-400 font-medium">
                        {car.model?.name}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Favorite Button */}
              {user && (
                <button
                  onClick={handleToggleFavorite}
                  className="p-3 rounded-full hover:bg-slate-700/50 transition-all duration-200"
                  disabled={toggleFavoriteMutation.isPending}
                >
                  {car.isFavorite ? (
                    <FaHeart className="w-6 h-6 text-pink-400" />
                  ) : (
                    <FaRegHeart className="w-6 h-6 text-slate-400 hover:text-pink-400" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="p-8 border-b border-slate-700/50">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-slate-400 text-lg">Price</span>
            </div>
            <div className="text-4xl font-bold text-green-400">
              ${car.price?.toLocaleString() || "Contact for price"}
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-200 mb-6">
              Vehicle Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Year */}
              <div className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg">
                <FaCalendar className="w-6 h-6 text-blue-400" />
                <div>
                  <p className="text-slate-400 text-sm">Year</p>
                  <p className="text-slate-200 text-lg font-semibold">
                    {car.year}
                  </p>
                </div>
              </div>

              {/* Color */}
              <div className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg">
                <FaPalette className={`w-6 h-6 text-${car.color.toLowerCase()}-400`} />
                <div>
                  <p className="text-slate-400 text-sm">Color</p>
                  <p className="text-slate-200 text-lg font-semibold">
                    {car.color}
                  </p>
                </div>
              </div>

              {/* Mileage */}
              {car.kmDriven && (
                <div className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg">
                  <FaTachometerAlt className="w-6 h-6 text-orange-400" />
                  <div>
                    <p className="text-slate-400 text-sm">Distance Driven</p>
                    <p className="text-slate-200 text-lg font-semibold">
                      {car.kmDriven.toLocaleString()} km
                    </p>
                  </div>
                </div>
              )}

              {/* Owner Info */}
              {car.createdBy && (
                <div className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg">
                  <FaUser className="w-6 h-6 text-slate-400" />
                  <div>
                    <p className="text-slate-400 text-sm">Listed by</p>
                    <p className="text-slate-200 text-lg font-semibold">
                      {car.createdBy.firstName} {car.createdBy.lastName}
                    </p>
                    {car.createdBy.role === "admin" && (
                      <span className="inline-block mt-1 px-2 py-1 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded-full">
                        Verified Dealer
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Manufacturer Info */}
            {car.model?.manufacturer && (
              <div className="mt-8 p-6 bg-slate-700/20 rounded-lg">
                <h3 className="text-xl font-bold text-slate-200 mb-3">
                  About {car.model.manufacturer.name}
                </h3>
                <p className="text-slate-400">
                  This vehicle is manufactured by {car.model.manufacturer.name},
                  known for their quality and reliability in the automotive
                  industry.
                </p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <FaIndustry className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="text-slate-400 text-sm">Brand</p>
                      <p className="text-slate-200 font-medium">
                        {car.model.manufacturer.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaCar className="w-4 h-4 text-purple-400" />
                    <div>
                      <p className="text-slate-400 text-sm">Model Series</p>
                      <p className="text-slate-200 font-medium">
                        {car.model.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Section */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-lg">
              <h3 className="text-xl font-bold text-slate-200 mb-3">
                Interested in this car?
              </h3>
              <p className="text-slate-400 mb-4">
                Contact the seller to learn more about this vehicle and arrange
                a viewing.
              </p>
              <div className="flex gap-4">
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200">
                  Contact Seller
                </button>
                <button className="border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-slate-200 px-6 py-3 rounded-lg font-medium transition-all duration-200">
                  Schedule Test Drive
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
