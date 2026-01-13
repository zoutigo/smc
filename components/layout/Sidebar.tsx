"use client";

import { nav } from "@/lib/constants/navigation";
import { useUIStore } from "@/lib/stores/ui-store";
import Link from "next/link";
import { usePathname } from "next/navigation";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar() {
  const pathname = usePathname() ?? "";
  const { sidebarCollapsed } = useUIStore();

  return (
    <aside
      className={cx(
        "flex h-screen flex-col border-r bg-[linear-gradient(180deg,#0E3571,#0A2A59)] text-white transition-[width]",
        sidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="h-10 w-10 rounded-md bg-white/10 flex items-center justify-center text-lg font-bold">
          S
        </div>
        <div className={cx("leading-tight", sidebarCollapsed && "sr-only")}>
          <div className="text-base font-semibold text-white">SMC</div>
          <div className="text-sm text-white/80">Storage Means Catalogue</div>
        </div>
      </div>

      <nav className="space-y-1 px-2 py-2">
        {nav.map((it) => {
          const active =
            pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));

          return (
            <Link
              key={it.href}
              href={it.href}
              className={cx(
                "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-base transition",
                active
                  ? "bg-white/15 text-white font-semibold"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <span className={cx(sidebarCollapsed && "sr-only")}>{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 px-2 pt-4 pb-6">
        <button className="w-full cursor-pointer rounded-md px-3 py-2 text-base text-white/80 hover:bg-white/10 hover:text-white">
          <span className={cx(sidebarCollapsed && "sr-only")}>Settings</span>
        </button>
      </div>
    </aside>
  );
}
