"use client";
import { CarBrand, CarBrandType } from "@repo/shared";
import { useEffect, useState } from "react";
import { trpc } from "../_trpc/client";

export default function CarForm({ editingCar, onDone }: any) {
  const [form, setForm] = useState({
    brand: CarBrand.BMW as CarBrandType,
    model: "",
    year: 2023,
    color: "",
    kmDriven: 0,
    price: 0,
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

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-900 text-white p-6 rounded-xl shadow-lg w-full max-w-lg"
    >
      <h2 className="text-xl font-bold mb-4">
        {editingCar ? "Edit Car" : "Add New Car"}
      </h2>

      <div className="mb-3">
        <label className="block text-sm mb-1">Year</label>
        <select
          value={form.brand}
          onChange={(e) =>
            setForm({ ...form, brand: e.target.value as CarBrandType })
          }
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        >
          {carBrands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      {["model", "color"].map((field) => (
        <div key={field} className="mb-3">
          <label className="block text-sm mb-1 capitalize">{field}</label>
          <input
            type="text"
            placeholder={`Enter ${field}`}
            value={(form as any)[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>
      ))}

      <div className="mb-3">
        <label className="block text-sm mb-1">Year</label>
        <input
          type="number"
          value={form.year}
          onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm mb-1">KM Driven</label>
        <input
          type="number"
          value={form.kmDriven}
          onChange={(e) =>
            setForm({ ...form, kmDriven: Number(e.target.value) })
          }
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-1">Price</label>
        <input
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold cursor-pointer"
        >
          {editingCar ? "Update" : "Add"}
        </button>
        {editingCar && (
          <button
            type="button"
            onClick={resetForm}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
