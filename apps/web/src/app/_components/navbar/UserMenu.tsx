"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FaHeart, FaUser } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import { trpc } from "../../_trpc/client";
import { User } from "../../_trpc/types";

interface UserMenuProps {
  user: User;
}

export default function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      logout();
      router.push("/");
    } catch (error: unknown) {
      // Even if logout fails on server, clear local state
      logout();

      // Don't show error toast for 401 - that means we're already logged out
      if (error && typeof error === "object" && "data" in error) {
        const errorData = (error as { data?: { httpStatus?: number } }).data;
        if (errorData?.httpStatus !== 401) {
          const errorMessage =
            error && typeof error === "object" && "message" in error
              ? (error as { message?: string }).message
              : "Logout failed";
          toast.error(errorMessage || "Logout failed");
        }
      } else {
        toast.error("Logout failed");
      }
    }
  };

  return (
    <>
      <div className="flex items-center space-x-4">
        {user.role === "admin" && (
          <span className="ml-2 px-3 py-1 bg-gradient-to-r from-green-500/20 to-green-500/20 border border-green-500/30 text-green-400 text-xs rounded-full font-medium">
            Admin
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Link
          href="/favorites"
          className={`p-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200 ${
            pathname === "/favorites"
              ? "text-pink-400 bg-slate-700/50"
              : "text-slate-400 hover:text-pink-400"
          }`}
          title="Favorites"
          aria-label="View favorites"
        >
          <FaHeart className="w-5 h-5" />
        </Link>

        <Link
          href="/account"
          className={`p-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200 ${
            pathname === "/account"
              ? "text-blue-400 bg-slate-700/50"
              : "text-slate-400 hover:text-blue-400"
          }`}
          title="Account Settings"
          aria-label="Account settings"
        >
          <FaUser className="w-5 h-5" />
        </Link>

        <button
          onClick={handleLogout}
          className="bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 border border-blue-500/30 hover:border-blue-400/50"
          aria-label="Logout"
        >
          Logout
        </button>
      </div>
    </>
  );
}
