"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/stores/ui-store";

export default function Header() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Keep a simple display name for now; initials can be reintroduced when used in UI.
  const displayName = useMemo(() => {
    return session?.user?.name ?? session?.user?.email ?? "Guest";
  }, [session]);

  const handleAvatarClick = () => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    setMenuOpen((open) => !open);
  };

  const handleNavigate = (href: string) => {
    setMenuOpen(false);
    if (pathname !== href) {
      router.push(href);
    }
  };

  return (
    <header className="relative h-14 border-b bg-white flex items-center px-6">
      <div className="ml-auto flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          aria-pressed={sidebarCollapsed}
          className="text-[rgb(14_53_113)]"
        >
          {sidebarCollapsed ? "Show menu" : "Hide menu"}
        </Button>
        <div className="text-base font-semibold text-[rgb(14_53_113)]">
          {displayName}
        </div>
        <button
          type="button"
          aria-label="Account menu"
          onClick={handleAvatarClick}
          className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          style={{
            backgroundColor: isAuthenticated ? "#16a34a" : "#ef4444",
          }}
        >
          <span className="text-sm font-semibold">👤</span>
        </button>
        {isAuthenticated && menuOpen ? (
          <div className="absolute right-4 top-14 w-44 rounded-md border bg-white shadow-card">
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-smc-bg cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
            >
              Logout
            </button>
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-smc-bg cursor-pointer"
              onClick={() => handleNavigate("/profile")}
            >
              Profile
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
