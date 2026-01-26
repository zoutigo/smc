import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/components/providers/session-provider";
import { ConfirmProvider } from "@/components/ui/confirm-message";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "SMC",
  description: "Smart management console",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-smc-bg text-smc-primary">
        <AuthProvider>
          <ConfirmProvider>
            <Header />
            <div className="flex min-h-[calc(100vh-56px-48px)]">
              <Sidebar />
              <div className="flex flex-1 flex-col">
                <main className="flex-1 px-6 py-6">{children}</main>
              </div>
            </div>
            <Footer />
          </ConfirmProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
