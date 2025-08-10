"use client";
import { useState } from "react";
import { trpc } from "../_trpc/client";

export default function CarList({ onEdit }: { onEdit: (car: any) => void }) {
  const [page, setPage] = useState(0);
  const limit = 6;

  const { data, error, isLoading } = trpc.cars.list.useQuery(
    {
      skip: page * limit,
      limit,
    },
    {
      staleTime: 1000 * 30, // cached for 30 seconds
    },
  );

  const utils = trpc.useUtils();
  const deleteCar = trpc.cars.deleteById.useMutation({
    onSuccess: () => utils.cars.list.invalidate(),
  });

  if (error) return <div className="text-red-500">❌ {error.message}</div>;
  if (isLoading) return <div className="text-gray-400">⏳ Loading...</div>;

  return (
    <div className="w-full max-w-5xl bg-gray-900 text-white rounded-xl shadow-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-800">
          <tr>
            {["Brand", "Model", "Year", "Color", "Price", "Actions"].map(
              (h) => (
                <th key={h} className="p-3 text-left font-semibold">
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {data?.items.map((car, idx) => (
            <tr
              key={car.id}
              className={`${
                idx % 2 === 0 ? "bg-gray-900" : "bg-gray-800"
              } hover:bg-gray-700 transition`}
            >
              <td className="p-3">{car.brand}</td>
              <td className="p-3">{car.model}</td>
              <td className="p-3">{car.year}</td>
              <td className="p-3">{car.color}</td>
              <td className="p-3">${car.price.toLocaleString()}</td>
              <td className="p-3 flex gap-2">
                <button
                  onClick={() => onEdit(car)}
                  className="bg-blue-500 hover:bg-blue-600 p-2 rounded-lg"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteCar.mutate({ id: car.id })}
                  className="bg-red-500 hover:bg-red-600 p-2 rounded-lg"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-between items-center p-4 bg-gray-800">
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-sm">
          Page {page + 1} of {Math.ceil((data?.meta.totalItems || 0) / limit)}
        </span>
        <button
          disabled={(page + 1) * limit >= (data?.meta.totalItems || 0)}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
