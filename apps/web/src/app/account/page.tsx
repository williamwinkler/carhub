"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaUser } from "react-icons/fa";
import { useAuth } from "../../lib/auth-context";
import Navbar from "../_components/Navbar";
import ApiKeyManager from "../_components/account/ApiKeyManager";
import ProfileForm from "../_components/account/ProfileForm";
import { trpc } from "../_trpc/client";

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const { data: userProfile, isLoading: profileLoading } =
    trpc.accounts.getMe.useQuery(undefined, { enabled: !!user });

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-slate-700 rounded w-1/3"></div>
            <div className="h-64 bg-slate-700 rounded"></div>
            <div className="h-64 bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-slate-400 mb-4">
            Access Denied
          </h1>
          <p className="text-slate-500 mb-8">
            Please log in to access your account settings.
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              title="Go back"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <FaUser className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Account Settings
                </h1>
                <p className="text-slate-400">
                  Manage your profile and API access
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Profile Information */}
          <ProfileForm user={userProfile} />

          {/* API Key Management */}
          <ApiKeyManager />

          {/* Account Actions */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-slate-200 mb-6">
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href={`/${user.id}/cars`}
                className="p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 rounded-lg transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                    🚗
                  </div>
                  <div>
                    <h3 className="text-slate-300 font-medium">My Cars</h3>
                    <p className="text-slate-500 text-sm">
                      Manage your listings
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href={`/${user.id}/favorites`}
                className="p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 rounded-lg transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center group-hover:bg-pink-500/30 transition-colors">
                    ❤️
                  </div>
                  <div>
                    <h3 className="text-slate-300 font-medium">Favorites</h3>
                    <p className="text-slate-500 text-sm">Saved cars</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/cars"
                className="p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 rounded-lg transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                    🔍
                  </div>
                  <div>
                    <h3 className="text-slate-300 font-medium">Browse Cars</h3>
                    <p className="text-slate-500 text-sm">Explore listings</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6">
            <h3 className="text-lg font-medium text-slate-300 mb-4">
              Account Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Member since:</span>
                <span className="text-slate-300 ml-2">
                  {new Date(userProfile.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div>
                <span className="text-slate-500">User ID:</span>
                <span className="text-slate-300 ml-2 font-mono text-xs">
                  {userProfile.id}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
