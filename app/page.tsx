import Link from "next/link";

const Pill = ({ children, tone = "primary" }: { children: React.ReactNode; tone?: "primary" | "secondary" | "accent" }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium text-white shadow-md ${
      tone === "secondary" ? "bg-secondary" : tone === "accent" ? "bg-accent" : "bg-primary"
    }`}
  >
    {children}
  </span>
);

const TinyIcon = ({ variant }: { variant: "grid" | "bolt" | "cloud" | "shield" | "link" | "eye" }) => {
  const base = "h-10 w-10 rounded-xl flex items-center justify-center text-white";
  const classes =
    variant === "bolt"
      ? `${base} bg-primary`
      : variant === "grid"
      ? `${base} bg-secondary`
      : variant === "cloud"
      ? `${base} bg-[rgb(var(--smc-info))]`
      : variant === "shield"
      ? `${base} bg-[rgb(var(--smc-warning))]`
      : variant === "link"
      ? `${base} bg-[rgba(var(--smc-secondary),0.8)]`
      : `${base} bg-[rgb(var(--smc-text))]`;
  const path =
    variant === "bolt"
      ? "M13 2 3 14h7l-1 8 10-12h-7z"
      : variant === "grid"
      ? "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"
      : variant === "cloud"
      ? "M5 15a4 4 0 0 1 0-8 6 6 0 0 1 11.3-2A5 5 0 1 1 18 15H5z"
      : variant === "shield"
      ? "M12 3 5 6v6c0 4 3.5 6.5 7 9 3.5-2.5 7-5 7-9V6z"
      : variant === "link"
      ? "M9 17 7 15a4 4 0 0 1 0-6l3-3a4 4 0 0 1 6 0l2 2M15 7l2 2a4 4 0 0 1 0 6l-3 3a4 4 0 0 1-6 0l-2-2"
      : "M12 5c1.5 0 6 4 6 7s-4.5 7-6 7-6-4-6-7 4.5-7 6-7zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z";
  return (
    <span className={classes} aria-hidden>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </svg>
    </span>
  );
};

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(8,108,125,0.08),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(86,132,175,0.12),transparent_45%),linear-gradient(180deg,rgb(244,247,252),rgba(244,247,252,0.65))] text-sm text-[rgb(var(--smc-text))]">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_70%,rgba(248,163,112,0.08),transparent_38%)]" aria-hidden />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
            <span className="text-lg font-semibold">SMC</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[rgb(var(--smc-text-muted))]">Storage Means Catalogue</p>
            <p className="text-base font-semibold">Operational clarity, everywhere.</p>
          </div>
        </div>
      </header>

      <section className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-10 pt-4 lg:flex-row lg:items-center lg:gap-12 lg:px-12">
        <div className="flex-1 space-y-6">
          <Pill tone="secondary">Next-gen industrial catalog</Pill>
          <h1 className="text-4xl font-bold leading-tight text-[rgb(var(--smc-text))] lg:text-5xl">
            Orchestrate packaging, storage, and transport means in one elegant workspace.
          </h1>
          <p className="max-w-2xl text-lg leading-7 text-[rgb(var(--smc-text-muted))]">
            SMC centralizes your categories, packaging↔transport compatibilities, plant images, and field notes for internal-flow operations. Benchmark plants remotely, remove meeting overhead, and give packaging engineers a fast lane to standardization.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-base font-semibold text-white shadow-lg shadow-primary/30 transition hover:translate-y-[-1px]"
            >
              Start the guided tour
              <span aria-hidden className="text-lg">
                ↗
              </span>
            </Link>
            <Link
              href="/packaging-means"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--smc-secondary),0.35)] px-5 py-3 text-base font-semibold text-[rgb(var(--smc-secondary))] transition hover:bg-[rgba(var(--smc-secondary),0.08)]"
            >
              Explore packaging
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Packaging", value: "320+", tone: "primary" },
              { label: "Transport", value: "145", tone: "secondary" },
              { label: "Flows covered", value: "29", tone: "accent" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-white/80 p-4 shadow-[0_16px_32px_rgba(12,24,56,0.08)] ring-1 ring-[rgba(var(--smc-border),1)] backdrop-blur"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-[rgb(var(--smc-text-muted))]">{stat.label}</p>
                  <p
                    className={`mt-2 text-2xl font-bold ${
                      stat.tone === "secondary" ? "text-[rgb(var(--smc-secondary))]" : stat.tone === "accent" ? "text-[rgb(var(--smc-warning))]" : "text-[rgb(var(--smc-primary))]"
                    }`}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

        <div className="flex-1">
          <div className="relative overflow-hidden rounded-[24px] bg-white shadow-[0_30px_60px_rgba(12,24,56,0.12)] ring-1 ring-[rgba(var(--smc-border),1)]">
            <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-[rgba(var(--smc-secondary),0.15)] blur-3xl" aria-hidden />
            <div className="absolute -right-10 bottom-6 h-36 w-36 rounded-full bg-[rgba(var(--smc-warning),0.18)] blur-2xl" aria-hidden />
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--smc-text-muted))]">Safety & standards first</p>
                  <p className="mt-1 text-xl font-semibold text-[rgb(var(--smc-text))]">Operate critical assets with confidence</p>
                  <div className="mt-2 space-y-1 text-sm text-[rgb(var(--smc-text-muted))]">
                    <p>• Preserve end-of-life learnings so experience never vanishes.</p>
                    <p>• AI-ready data today for smarter rationalization tomorrow.</p>
                  </div>
                </div>
                <Pill tone="accent">Live dashboards</Pill>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { title: "Packaging catalog", desc: "Images, part compatibility, pricing, SOP/EOP", icon: "grid" as const },
                  { title: "Transport catalog", desc: "Capacity, speeds, flows served, packaging carried", icon: "cloud" as const },
                  { title: "Field notes", desc: "Knowledge and evidence tied to every asset", icon: "bolt" as const },
                  { title: "Flows", desc: "Visibility across injection → paint → assembly", icon: "link" as const },
                ].map((card) => (
                  <div key={card.title} className="rounded-2xl bg-[rgba(var(--smc-secondary),0.06)] p-4 ring-1 ring-[rgba(var(--smc-border),1)]">
                    <div className="mb-3">
                      <TinyIcon variant={card.icon} />
                    </div>
                    <p className="text-sm font-semibold text-[rgb(var(--smc-text))]">{card.title}</p>
                    <p className="mt-2 text-sm text-[rgb(var(--smc-text-muted))]">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-6xl gap-6 px-6 pb-18 lg:px-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--smc-text-muted))]">Why SMC?</p>
            <h2 className="text-2xl font-semibold text-[rgb(var(--smc-text))]">Three levers for industrial teams</h2>
          </div>
          <Pill tone="secondary">Audit-ready</Pill>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {([
            {
              title: "Faster decisions",
              desc: "Compare capacity, costs, status, and compatibilities in two clicks.",
              icon: "bolt" as const,
            },
            {
              title: "Shared knowledge",
              desc: "Notes, images, and flows attached to assets keep plant & central aligned.",
              icon: "cloud" as const,
            },
            {
              title: "Data you trust",
              desc: "SOP/EOP, suppliers, pricing, and flows always up to date and exportable.",
              icon: "shield" as const,
            },
          ] satisfies Array<{ title: string; desc: string; icon: "grid" | "bolt" | "cloud" | "shield" | "link" | "eye" }>).map((item) => (
            <div
              key={item.title}
              className="flex h-full flex-col rounded-2xl bg-white/90 p-5 shadow-[0_20px_40px_rgba(12,24,56,0.1)] ring-1 ring-[rgba(var(--smc-border),1)] backdrop-blur"
            >
              <div className="mb-3">
                <TinyIcon variant={item.icon} />
              </div>
              <p className="text-lg font-semibold text-[rgb(var(--smc-text))]">{item.title}</p>
              <p className="mt-2 text-sm text-[rgb(var(--smc-text-muted))]">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-4 rounded-2xl bg-white/90 p-5 shadow-[0_16px_32px_rgba(12,24,56,0.08)] ring-1 ring-[rgba(var(--smc-border),1)] lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[rgb(var(--smc-text))]">Built for internal flow management</p>
            <ul className="space-y-2 text-sm text-[rgb(var(--smc-text-muted))]">
              <li>• Map injection → paint → assembly flows and link them to means.</li>
              <li>• Benchmark plants remotely: no travel, no meeting chase, faster decisions.</li>
              <li>• Track deployment rate of each mean across sites.</li>
              <li>• Standardize faster: packaging engineers reuse vetted solutions across plants.</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[rgb(var(--smc-text))]">Reduce errors and accelerate reuse</p>
            <ul className="space-y-2 text-sm text-[rgb(var(--smc-text-muted))]">
              <li>• Attach instructions/notes to avoid repeat mistakes in packaging development.</li>
              <li>• Spot and promote reuse opportunities between plants automatically.</li>
              <li>• Maintain supplier and flow context on every asset for quick alignment.</li>
              <li>• Preserve end-of-life learnings: capture full history so experience isn’t lost.</li>
              <li>• AI-ready data: collect rich, structured context now to fuel future rationalization.</li>
              <li>• Future-proof: add more KPIs and dashboards without changing the data model.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl rounded-[28px] bg-gradient-to-r from-secondary to-primary px-6 py-10 text-white shadow-[0_22px_44px_rgba(12,24,56,0.18)] lg:px-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-white/70">Ready to launch?</p>
            <h3 className="text-3xl font-semibold leading-tight">Build your complete catalog in under an hour.</h3>
            <p className="max-w-2xl text-base text-white/85">
              Import packaging, transport, and storage means, link them to flows, and give teams a crystal-clear navigation experience.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/packaging-means"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-base font-semibold text-primary shadow-lg shadow-black/10 transition hover:translate-y-[-1px]"
            >
              Browse the catalog
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/60 px-5 py-3 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Open dashboards
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 py-10 text-[rgb(var(--smc-text-muted))] lg:px-12">
        <p className="text-sm">SMC — Storage Means Catalogue</p>
        <p className="text-xs">Built for packaging, logistics, and industrialization teams.</p>
      </footer>
    </main>
  );
}
