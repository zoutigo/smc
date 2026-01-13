export default function Footer() {
  return (
    <footer className="h-12 border-t bg-white flex items-center px-6">
      <p className="text-xs text-[rgb(87_78_92)]">
        © {new Date().getFullYear()} SMC — Storage Means Catalogue
      </p>
    </footer>
  );
}
