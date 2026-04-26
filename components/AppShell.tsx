import Link from "next/link";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-cocoa">
      <header className="sticky top-0 z-30 border-b border-cocoa/10 bg-cream/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="leading-none">
            <span className="block text-[0.68rem] font-bold uppercase tracking-[0.28em] text-bark">Household</span>
            <span className="font-editorial text-2xl font-semibold text-cocoa">HomeStock AI</span>
          </Link>
          <div className="hidden items-center gap-1 text-sm font-semibold md:flex">
            <Link className="rounded-md px-3 py-2 text-bark hover:bg-paper" href="/memory">
              Memory
            </Link>
            <Link className="rounded-md px-3 py-2 text-bark hover:bg-paper" href="/household">
              Household
            </Link>
            <Link className="rounded-md px-3 py-2 text-bark hover:bg-paper" href="/grocery">
              Grocery
            </Link>
            <Link className="rounded-md px-3 py-2 text-bark hover:bg-paper" href="/add">
              Add
            </Link>
            <Link className="rounded-md px-3 py-2 text-bark hover:bg-paper" href="/approve">
              Approve
            </Link>
            <Link className="rounded-md px-3 py-2 text-bark hover:bg-paper" href="/cart">
              Cart
            </Link>
            <Link className="rounded-md px-3 py-2 text-bark hover:bg-paper" href="/integrations/swiggy">
              Swiggy
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-10">{children}</main>
      <BottomNav />
    </div>
  );
}
