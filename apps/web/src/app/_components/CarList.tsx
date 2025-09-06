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
            {Array(7)
              .fill(null)
              .map((_, idx) => (
                <td key={idx} className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </td>
              ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function CarList({ onEdit }: CarListProps) {
  const [page, setPage] = useState(0);
  const limit = 8;

  const { data, error, isLoading, isFetching } = trpc.cars.list.useQuery({
    skip: page * limit,
    limit,
  });

  const utils = trpc.useUtils();
  const deleteCar = trpc.cars.deleteById.useMutation({
    onSuccess: () => utils.cars.list.invalidate(),
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
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

  const totalPages = Math.ceil((data?.meta.totalItems || 0) / limit);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full max-w-6xl">
      <div className="px-8 py-6 border-b border-gray-100 flex justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Car Inventory</h3>
          <p className="text-gray-600 mt-1">
            {data?.meta.totalItems || 0} cars total
          </p>
        </div>
        {isFetching && !isLoading && (
          <div className="flex items-center text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
            Updating...
          </div>
        )}
      </div>

      <div className="relative" style={{ minHeight: "600px" }}>
        {isLoading ? (
          <TableSkeleton />
        ) : data?.items.length === 0 ? (
          <div className="text-center py-12">No cars found</div>
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
              <tbody className="divide-y divide-gray-200 text-black">
                {data?.items.map((car) => (
                  <tr
                    key={car.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">{car.brand}</td>
                    <td className="px-6 py-4">{car.model}</td>
                    <td className="px-6 py-4">{car.year}</td>
                    <td className="px-6 py-4">{car.color}</td>
                    <td className="px-6 py-4">
                      {car.kmDriven.toLocaleString()} km
                    </td>
                    <td className="px-6 py-4">{car.price.toLocaleString()}€</td>
                    <td className="px-6 py-4 flex space-x-2">
                      <button
                        onClick={() => onEdit(car)}
                        className="text-blue-600 hover:bg-blue-500 hover:text-white p-2 rounded-lg"
                      >
                        <EditOutlined />
                      </button>
                      <button
                        onClick={() => deleteCar.mutate({ id: car.id })}
                        className="text-red-600 hover:bg-red-500 hover:text-white p-2 rounded-lg"
                        disabled={deleteCar.isPending}
                      >
                        <DeleteOutlined />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="bg-gray-50 text-black px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <button
            disabled={page === 0 || isFetching}
            onClick={() => handlePageChange(page - 1)}
            className="px-4 py-2 border rounded-md disabled:opacity-50 cursor-pointer disabled:cursor-auto hover:bg-gray-300"
          >
            Previous
          </button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1 || isFetching}
            onClick={() => handlePageChange(page + 1)}
            className="px-4 py-2 border rounded-md disabled:opacity-50 cursor-pointer disabled:cursor-auto hover:bg-gray-300"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
