"use client";

import { nav } from "@/lib/constants/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar() {
  const pathname = usePathname() ?? "";

  return (
    <aside className="w-64 border-r bg-white px-3 py-4 sticky top-14 h-[calc(100vh-56px)]">
      <nav className="space-y-1">
        {nav.map((it) => {
          const active =
            pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));

          return (
            <Link
              key={it.href}
              href={it.href}
              className={cx(
                "block cursor-pointer rounded-md px-3 py-2 text-sm transition",
                active
                  ? "bg-[rgb(110_148_182)]/20 text-[rgb(14_53_113)] font-medium"
                  : "text-[rgb(87_78_92)] hover:bg-[rgb(110_148_182)]/10 hover:text-[rgb(14_53_113)]"
              )}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t pt-4">
        <button className="w-full cursor-pointer rounded-md px-3 py-2 text-sm text-[rgb(87_78_92)] hover:bg-[rgb(110_148_182)]/10 hover:text-[rgb(14_53_113)]">
          Settings
        </button>
      </div>
    </aside>
  );
}
