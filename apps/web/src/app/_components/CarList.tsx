"use client";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { CarBrandType } from "packages/shared/src";
import { useState } from "react";
import { trpc } from "../_trpc/client";

export type Car = {
  id: string;
  brand: CarBrandType;
  model: string;
  year: number;
  color: string;
  kmDriven: number;
  price: number;
};

interface CarListProps {
  onEdit: (car: Car) => void;
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  </div>
);

const TableSkeleton = () => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          {[
            "Brand",
            "Model",
            "Year",
            "Color",
            "KM Driven",
            "Price",
            "Actions",
          ].map((header) => (
            <th
              key={header}
              className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {[...Array(8)].map((_, i) => (
          <tr key={i} className="animate-pulse">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex space-x-2">
                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function CarList({ onEdit }: CarListProps) {
  const [page, setPage] = useState(0);
  const [isChangingPage, setIsChangingPage] = useState(false);
  const limit = 8;

  const { data, error, isLoading, isFetching } = trpc.cars.list.useQuery(
    {
      skip: page * limit,
      limit,
    },
    {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
    },
  );

  const utils = trpc.useUtils();
  const deleteCar = trpc.cars.deleteById.useMutation({
    onSuccess: () => utils.cars.list.invalidate(),
  });

  const handlePageChange = async (newPage: number) => {
    setIsChangingPage(true);

    // Prefetch the next page data
    await utils.cars.list.prefetch(
      {
        skip: newPage * limit,
        limit,
      },
      {
        staleTime: 1000 * 15, // cached for 15 seconds
      },
    );

    setPage(newPage);

    // Small delay to ensure smooth transition
    setTimeout(() => {
      setIsChangingPage(false);
    }, 100);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          Error: {error.message}
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil((data?.meta.total || 0) / limit);
  const showLoading = isLoading || isChangingPage;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full max-w-6xl">
      <div className="px-8 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Car Inventory</h3>
            <p className="text-gray-600 mt-1">
              {data?.meta.total || 0} cars total
            </p>
          </div>
          {(isFetching || isChangingPage) && !isLoading && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
              Updating...
            </div>
          )}
        </div>
      </div>

      {/* Fixed height container to prevent jumping */}
      <div className="relative" style={{ minHeight: "600px" }}>
        {showLoading ? (
          <TableSkeleton />
        ) : data?.items.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No cars</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a new car.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Brand",
                    "Model",
                    "Year",
                    "Color",
                    "KM Driven",
                    "Price",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.items.map((car) => (
                  <tr
                    key={car.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {car.brand}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{car.model}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{car.year}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {car.color}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {car.kmDriven.toLocaleString()} km
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${car.price.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEdit(car)}
                          className="text-blue-600 hover:text-blue-50 p-2 rounded-lg hover:bg-blue-500 transition-colors cursor-pointer"
                          title="Edit car"
                        >
                          <EditOutlined />
                        </button>
                        <button
                          onClick={() => deleteCar.mutate({ id: car.id })}
                          className="text-red-600 hover:text-red-50 p-2 rounded-lg hover:bg-red-500 transition-color cursor-pointer"
                          title="Delete car"
                          disabled={deleteCar.isPending}
                        >
                          <DeleteOutlined />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              disabled={page === 0 || isChangingPage}
              onClick={() => handlePageChange(page - 1)}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages - 1 || isChangingPage}
              onClick={() => handlePageChange(page + 1)}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{page * limit + 1}</span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min((page + 1) * limit, data?.meta.total || 0)}
                </span>{" "}
                of <span className="font-medium">{data?.meta.total || 0}</span>{" "}
                results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  disabled={page === 0 || isChangingPage}
                  onClick={() => handlePageChange(page - 1)}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages - 1 || isChangingPage}
                  onClick={() => handlePageChange(page + 1)}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
