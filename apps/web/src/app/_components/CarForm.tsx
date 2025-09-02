"use client";
import { CarBrand, CarBrandType } from "@repo/shared";
import { useEffect, useState } from "react";
import { trpc } from "../_trpc/client";
import { Car } from "./CarList";

interface CarFormProps {
  editingCar: Car | null;
  onDone: () => void;
}

export default function CarForm({ editingCar, onDone }: CarFormProps) {
  const [form, setForm] = useState({
    brand: CarBrand.BMW as CarBrandType,
    model: "",
    year: 2023,
    color: "",
    kmDriven: 35000,
    price: 10500,
  });

  const utils = trpc.useUtils();
  const createCar = trpc.cars.create.useMutation({
    onSuccess: () => {
      utils.cars.list.invalidate();
      resetForm();
    },
  });

  const updateCar = trpc.cars.update.useMutation({
    onSuccess: () => {
      utils.cars.list.invalidate();
      resetForm();
    },
  });

  useEffect(() => {
    if (editingCar) {
      const { id, ...rest } = editingCar;
      setForm(rest);
    }
  }, [editingCar]);

  const resetForm = () => {
    setForm({
      brand: CarBrand.BMW,
      model: "",
      year: 2023,
      color: "",
      kmDriven: 0,
      price: 0,
    });
    onDone();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCar) {
      updateCar.mutate({ id: editingCar.id, data: form });
    } else {
      createCar.mutate(form);
    }
  };

  const carBrands = Object.values(CarBrand);
  const isLoading = createCar.isPending || updateCar.isPending;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {editingCar ? "Edit Car" : "Add New Car"}
        </h2>
        {editingCar && (
          <button
            type="button"
            onClick={resetForm}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand
            </label>
            <select
              value={form.brand}
              onChange={(e) =>
                setForm({ ...form, brand: e.target.value as CarBrandType })
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
              required
            >
              {carBrands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <input
              type="text"
              placeholder="Enter model"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <input
              type="number"
              value={form.year}
              onChange={(e) =>
                setForm({ ...form, year: Number(e.target.value) })
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <input
              type="text"
              placeholder="Enter color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              KM Driven
            </label>
            <input
              type="number"
              value={form.kmDriven}
              onChange={(e) =>
                setForm({ ...form, kmDriven: Number(e.target.value) })
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (€)
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
              required
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center cursor-pointer"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {editingCar ? "Updating..." : "Adding..."}
              </>
            ) : editingCar ? (
              "Update Car"
            ) : (
              "Add Car"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
