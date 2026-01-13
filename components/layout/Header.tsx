export default function Header() {
  return (
    <header className="h-14 border-b bg-white flex items-center px-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-md bg-[rgb(14_53_113)]" />
        <div className="leading-tight">
          <div className="text-sm font-semibold text-[rgb(14_53_113)]">SMC</div>
          <div className="text-xs text-[rgb(87_78_92)]">Storage Means Catalogue</div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="text-xs text-[rgb(87_78_92)]">Valery</div>
        <div className="h-8 w-8 rounded-full bg-[rgb(110_148_182)]" />
      </div>
    </header>
  );
}
