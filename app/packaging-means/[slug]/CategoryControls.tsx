"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Option = { id: string; name?: string; slug?: string };

type Props = {
  showHero: boolean;
  plantId: string;
  flowId: string;
  plants: Array<Option>;
  flows: Array<Option>;
  basePath?: string;
};

export function CategoryControls({ showHero, plantId, flowId, plants, flows, basePath = "/packaging-means" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const plantSelectId = "plant-filter";
  const flowSelectId = "flow-filter";

  const buildUrl = (partial: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (partial.plantId !== undefined) {
      if (partial.plantId === "") {
        params.delete("plantId");
      } else {
        params.set("plantId", partial.plantId);
      }
    }
    if (partial.flowId !== undefined) {
      if (partial.flowId === "") {
        params.delete("flowId");
      } else {
        params.set("flowId", partial.flowId);
      }
    }
    if ("showHero" in partial) {
      if (partial.showHero === "1") params.set("showHero", "1");
      else params.delete("showHero");
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={basePath}
        className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
      >
        Back
      </Link>
      <button
        type="button"
        className="rounded-md border border-secondary bg-secondary px-3 py-2 text-sm font-semibold text-white hover:bg-secondary/80"
        onClick={() => router.push(buildUrl({ showHero: showHero ? "" : "1" }))}
      >
        {showHero ? "Close hero" : "Show hero"}
      </button>
      <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => e.preventDefault()}>
        <label className="text-sm text-smc-text" htmlFor={plantSelectId}>Plant</label>
        <select
          id={plantSelectId}
          name="plantId"
          value={plantId}
          onChange={(e) => router.push(buildUrl({ plantId: e.target.value }))}
          className="rounded-md border border-smc-border/80 bg-white px-2 py-1 text-sm"
        >
          <option value="">All</option>
          {plants.map((p) => (
            <option key={p.id} value={p.id}>{p.name ?? p.slug ?? p.id}</option>
          ))}
        </select>
        <label className="text-sm text-smc-text" htmlFor={flowSelectId}>Flow</label>
        <select
          id={flowSelectId}
          name="flowId"
          value={flowId}
          onChange={(e) => router.push(buildUrl({ flowId: e.target.value }))}
          className="rounded-md border border-smc-border/80 bg-white px-2 py-1 text-sm"
        >
          <option value="">All</option>
          {flows.map((f) => (
            <option key={f.id} value={f.id}>{f.slug ?? f.name ?? f.id}</option>
          ))}
        </select>
      </form>
    </div>
  );
}
