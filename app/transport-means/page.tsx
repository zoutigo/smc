import Link from "next/link";
import { CustomButton } from "@/components/ui/custom-button";
import { getTransportMeanCategories } from "./actions";

export const dynamic = "force-dynamic";

export default async function TransportMeansPage() {
  const categories = await getTransportMeanCategories();

  return (
    <main className="px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-smc-primary/80">Transport means</p>
          <h1 className="heading-1">Transport catalogue</h1>
          <p className="text-sm text-smc-text-muted">Browse all transport mean categories.</p>
        </div>
        <CustomButton href="/transport-means/new" text="Create category" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/transport-means/${cat.slug}`}
            className="rounded-2xl border border-smc-border/70 bg-white p-4 shadow-soft hover:-translate-y-[1px] transition"
          >
            <h3 className="text-lg font-semibold text-smc-text">{cat.name}</h3>
            <p className="text-sm text-smc-text-muted line-clamp-2">{cat.description ?? "No description."}</p>
          </Link>
        ))}
        {categories.length === 0 ? <p className="text-sm text-smc-text-muted">No transport mean categories yet.</p> : null}
      </div>
    </main>
  );
}
