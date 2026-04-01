"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "../../_trpc/types";

interface NavigationLinksProps {
  user: User | null;
}

export default function NavigationLinks({ user }: NavigationLinksProps) {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex items-center space-x-8">
      <Link
        href="/cars"
        className={`text-slate-300 hover:text-blue-400 transition-colors duration-200 font-medium ${
          pathname === "/cars" ? "text-blue-400" : ""
        }`}
      >
        All Cars
      </Link>

      {user && (
        <Link
          href={`/${user.username}/cars`}
          className={`text-slate-300 hover:text-blue-400 transition-colors duration-200 font-medium flex items-center gap-2 ${
            pathname === `/${user.username}/cars` ? "text-blue-400" : ""
          }`}
        >
          My Cars
        </Link>
      )}
    </div>
  );
}
