"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import NavigationLinks from "./navbar/NavigationLinks";
import NavbarLoginForm from "./navbar/NavbarLoginForm";
import UserMenu from "./navbar/UserMenu";

export default function Navbar() {
  const { user } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <nav className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 shadow-xl relative z-[9999]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent hover:from-blue-300 hover:to-purple-300 transition-all duration-200"
            >
              CarHub
            </Link>
          </div>

          {/* Navigation Links */}
          <NavigationLinks user={user} />

          {/* User Menu / Login */}
          <div className="flex items-center space-x-4">
            {user ? (
              <UserMenu user={user} />
            ) : (
              <NavbarLoginForm
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                onToggle={() => setIsLoginOpen(true)}
              />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
