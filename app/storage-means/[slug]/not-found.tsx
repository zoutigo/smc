import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-8 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-smc-primary/80">Storage means</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Category not found</h1>
        <p className="mt-2 max-w-xl text-base text-slate-600">
          We could not find the storage mean category you were looking for. It may have been renamed or removed.
        </p>
      </div>
      <Link href="/storage-means" className={cn(buttonVariants({ variant: "default" }), "px-6")}>Return to storage means</Link>
    </main>
  );
}
