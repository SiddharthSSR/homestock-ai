import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "HomeStock AI",
  description: "Shared household grocery memory and approval assistant"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-slate-200 bg-white/85 backdrop-blur">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
              <Link href="/" className="text-lg font-semibold text-ink">
                HomeStock AI
              </Link>
              <div className="flex items-center gap-2 text-sm">
                <Link className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100" href="/household">
                  Household
                </Link>
                <Link className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100" href="/grocery">
                  Grocery
                </Link>
                <Link className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100" href="/cart">
                  Cart
                </Link>
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
