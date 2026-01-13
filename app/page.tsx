import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-smc-bg flex items-center justify-center">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-3xl font-bold text-smc-primary">
          SMC
        </h1>

        <p className="text-sm text-smc-textMuted">
          Storage Means Catalogue — manage, compare and document your storage
          infrastructure in one place.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md bg-smc-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
