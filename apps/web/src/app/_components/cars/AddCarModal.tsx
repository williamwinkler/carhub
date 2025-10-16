"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { FaCar } from "react-icons/fa";
import { trpc } from "../../_trpc/client";
import Modal from "../ui/Modal";

interface AddCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  modelId: string;
  year: number;
  color: string;
  kmDriven: number;
  price: number;
}

const currentYear = new Date().getFullYear();

export default function AddCarModal({
  isOpen,
  onClose,
  onSuccess,
}: AddCarModalProps) {
  const [selectedManufacturerSlug, setSelectedManufacturerSlug] =
    useState<string>("");

  const [formData, setFormData] = useState<FormData>({
    modelId: "",
    year: currentYear,
    color: "",
    kmDriven: 0,
    price: 0,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );

  // Fetch car manufacturers for dropdown (static data - won't change during session)
  const { data: manufacturersData, isLoading: manufacturersLoading } =
    trpc.carManufacturers.list.useQuery(undefined, {
      staleTime: "static",
    });

  // Fetch car models based on selected manufacturer (static data - won't change during session)
  const { data: carModelsData, isLoading: modelsLoading } =
    trpc.carModels.list.useQuery(
      {
        manufacturerSlug: selectedManufacturerSlug,
      },
      {
        enabled: !!selectedManufacturerSlug,
        staleTime: "static",
      },
    );

  const createCarMutation = trpc.cars.create.useMutation({
    onSuccess: () => {
      toast.success("Car added successfully!");
      handleClose();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add car");
    },
  });

  const handleClose = () => {
    setSelectedManufacturerSlug("");
    setFormData({
      modelId: "",
      year: currentYear,
      color: "",
      kmDriven: 0,
      price: 0,
    });
    setErrors({});
    onClose();
  };

  const handleManufacturerChange = (manufacturerSlug: string) => {
    setSelectedManufacturerSlug(manufacturerSlug);
    // Reset model selection when manufacturer changes
    setFormData({ ...formData, modelId: "" });
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.modelId) {
      newErrors.modelId = "Please select a car model";
    }

    if (!formData.color.trim()) {
      newErrors.color = "Color is required";
    } else if (formData.color.length > 100) {
      newErrors.color = "Color must be less than 100 characters";
    }

    if (formData.year < 1886 || formData.year > currentYear + 1) {
      newErrors.year = `Year must be between 1886 and ${currentYear + 1}`;
    }

    if (formData.kmDriven < 0 || formData.kmDriven > 10_000_000) {
      newErrors.kmDriven = "Kilometers must be between 0 and 10,000,000";
    }

    if (formData.price < 0) {
      newErrors.price = "Price must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await createCarMutation.mutateAsync(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Car"
      icon={<FaCar className="w-6 h-6 text-blue-400" />}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Car Manufacturer Selection */}
        <div>
          <label
            htmlFor="manufacturerId"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Car Manufacturer <span className="text-red-400">*</span>
          </label>
          <select
            id="manufacturerId"
            value={selectedManufacturerSlug}
            onChange={(e) => handleManufacturerChange(e.target.value)}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
            disabled={manufacturersLoading || createCarMutation.isPending}
          >
            <option value="">
              {manufacturersLoading
                ? "Loading manufacturers..."
                : "Select a manufacturer"}
            </option>
            {manufacturersData?.items.map((manufacturer) => (
              <option key={manufacturer.id} value={manufacturer.slug}>
                {manufacturer.name}
              </option>
            ))}
          </select>
        </div>

        {/* Car Model Selection */}
        <div>
          <label
            htmlFor="modelId"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Car Model <span className="text-red-400">*</span>
          </label>
          <select
            id="modelId"
            value={formData.modelId}
            onChange={(e) =>
              setFormData({ ...formData, modelId: e.target.value })
            }
            className={`w-full px-4 py-2 bg-slate-900 border ${errors.modelId ? "border-red-500" : "border-slate-600"} rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50`}
            disabled={
              !selectedManufacturerSlug ||
              modelsLoading ||
              createCarMutation.isPending
            }
          >
            <option value="">
              {!selectedManufacturerSlug
                ? "Select a manufacturer first"
                : modelsLoading
                  ? "Loading models..."
                  : "Select a car model"}
            </option>
            {carModelsData?.items.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          {errors.modelId && (
            <p className="text-red-400 text-sm mt-1">{errors.modelId}</p>
          )}
        </div>

        {/* Year */}
        <div>
          <label
            htmlFor="year"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Year <span className="text-red-400">*</span>
          </label>
          <input
            id="year"
            type="number"
            value={formData.year}
            onChange={(e) =>
              setFormData({ ...formData, year: parseInt(e.target.value) || 0 })
            }
            min={1886}
            max={currentYear + 1}
            className={`w-full px-4 py-2 bg-slate-900 border ${errors.year ? "border-red-500" : "border-slate-600"} rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition-colors`}
            disabled={createCarMutation.isPending}
          />
          {errors.year && (
            <p className="text-red-400 text-sm mt-1">{errors.year}</p>
          )}
        </div>

        {/* Color */}
        <div>
          <label
            htmlFor="color"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Color <span className="text-red-400">*</span>
          </label>
          <input
            id="color"
            type="text"
            value={formData.color}
            onChange={(e) =>
              setFormData({ ...formData, color: e.target.value })
            }
            maxLength={100}
            placeholder="e.g., Red, Blue, Silver"
            className={`w-full px-4 py-2 bg-slate-900 border ${errors.color ? "border-red-500" : "border-slate-600"} rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition-colors`}
            disabled={createCarMutation.isPending}
          />
          {errors.color && (
            <p className="text-red-400 text-sm mt-1">{errors.color}</p>
          )}
        </div>

        {/* Kilometers Driven */}
        <div>
          <label
            htmlFor="kmDriven"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Kilometers Driven <span className="text-red-400">*</span>
          </label>
          <input
            id="kmDriven"
            type="number"
            value={formData.kmDriven}
            onChange={(e) =>
              setFormData({
                ...formData,
                kmDriven: parseInt(e.target.value) || 0,
              })
            }
            min={0}
            max={10_000_000}
            placeholder="e.g., 50000"
            className={`w-full px-4 py-2 bg-slate-900 border ${errors.kmDriven ? "border-red-500" : "border-slate-600"} rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition-colors`}
            disabled={createCarMutation.isPending}
          />
          {errors.kmDriven && (
            <p className="text-red-400 text-sm mt-1">{errors.kmDriven}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Price (€) <span className="text-red-400">*</span>
          </label>
          <input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: parseInt(e.target.value) || 0 })
            }
            min={0}
            placeholder="e.g., 25000"
            className={`w-full px-4 py-2 bg-slate-900 border ${errors.price ? "border-red-500" : "border-slate-600"} rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition-colors`}
            disabled={createCarMutation.isPending}
          />
          {errors.price && (
            <p className="text-red-400 text-sm mt-1">{errors.price}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-700">
          <button
            type="button"
            onClick={handleClose}
            disabled={createCarMutation.isPending}
            className="flex-1 px-4 py-2 bg-slate-600/50 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 font-medium rounded-lg transition-all duration-200"
          >
            Close
          </button>
          <button
            type="submit"
            disabled={createCarMutation.isPending || modelsLoading}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200"
          >
            {createCarMutation.isPending ? "Adding..." : "Add"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
