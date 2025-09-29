"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../../lib/auth-context";
import { trpc } from "../../_trpc/client";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
}

interface ProfileFormProps {
  user: User;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [isChanged, setIsChanged] = useState(false);

  const { login } = useAuth();
  const utils = trpc.useContext();

  const updateProfileMutation = trpc.accounts.updateProfile.useMutation({
    onSuccess: (updatedUser) => {
      utils.accounts.getMe.invalidate();
      login(updatedUser);
      toast.success("Profile updated successfully!");
      setIsChanged(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const handleInputChange = (
    field: "firstName" | "lastName",
    value: string,
  ) => {
    if (field === "firstName") {
      setFirstName(value);
      setIsChanged(value !== user.firstName || lastName !== user.lastName);
    } else {
      setLastName(value);
      setIsChanged(firstName !== user.firstName || value !== user.lastName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isChanged) return;

    await updateProfileMutation.mutateAsync({
      firstName,
      lastName,
    });
  };

  const handleReset = () => {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setIsChanged(false);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-200">
          Profile Information
        </h2>
        {user.role === "admin" && (
          <span className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-green-500/20 border border-green-500/30 text-green-400 text-sm rounded-full font-medium">
            Admin
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              placeholder="Enter your first name"
              required
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              placeholder="Enter your last name"
              required
            />
          </div>
        </div>

        {/* Username (Read-only) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Username</label>
          <input
            type="text"
            value={user.username}
            readOnly
            className="w-full px-4 py-3 bg-slate-700/30 border border-slate-600/30 rounded-lg text-slate-400 cursor-not-allowed"
          />
          <p className="text-xs text-slate-500">Username cannot be changed</p>
        </div>

        {/* Action Buttons */}
        {isChanged && (
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-700/50">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 bg-slate-600/50 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-all duration-200"
              disabled={updateProfileMutation.isPending}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={updateProfileMutation.isPending || !isChanged}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200"
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
