import Link from "next/link";
import { BottomNav } from "./BottomNav";
import { PreservedQueryLink } from "./PreservedQueryLink";
import { SignOutButton } from "./SignOutButton";
import { auth } from "@/lib/auth/config";
import { isDemoModeEnabled } from "@/lib/household-selection";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const isDemoMode = isDemoModeEnabled();
  const session = isDemoMode ? null : await auth().catch(() => null);
  const sessionUser = session?.user ?? null;

  return (
    <div className="min-h-screen text-cocoa">
      <header className="sticky top-0 z-30 border-b border-cocoa/10 bg-cream/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <PreservedQueryLink href="/" className="leading-none">
            <span className="block text-[0.68rem] font-bold uppercase tracking-[0.28em] text-bark">Household</span>
            <span className="font-editorial text-2xl font-semibold text-cocoa">HomeStock AI</span>
          </PreservedQueryLink>
          <div className="hidden items-center gap-1 text-sm font-semibold md:flex">
            <PreservedQueryLink className="rounded-md px-3 py-2 text-bark hover:bg-paper" href="/notifications">
              Notifications
            </PreservedQueryLink>
            <PreservedQueryLink className="rounded-md px-3 py-2 text-bark hover:bg-paper" href="/memory">
              Memory
            </PreservedQueryLink>
            <PreservedQueryLink className="rounded-md px-3 py-2 text-bark hover:bg-paper" href="/household">
              Household
            </PreservedQueryLink>
            <PreservedQueryLink className="rounded-md px-3 py-2 text-bark hover:bg-paper" href="/grocery">
              Grocery
            </PreservedQueryLink>
            <PreservedQueryLink className="rounded-md px-3 py-2 text-bark hover:bg-paper" href="/add">
              Add
            </PreservedQueryLink>
            <PreservedQueryLink className="rounded-md px-3 py-2 text-bark hover:bg-paper" href="/approve">
              Approve
            </PreservedQueryLink>
            <PreservedQueryLink className="rounded-md px-3 py-2 text-bark hover:bg-paper" href="/cart">
              Cart
            </PreservedQueryLink>
            <PreservedQueryLink className="rounded-md px-3 py-2 text-bark hover:bg-paper" href="/integrations/swiggy">
              Swiggy
            </PreservedQueryLink>
            {!isDemoMode ? (
              sessionUser ? (
                <div className="ml-2 flex items-center gap-2 border-l border-cocoa/10 pl-3">
                  <span className="text-xs text-bark">
                    Signed in as <span className="font-semibold text-cocoa">{sessionUser.name ?? sessionUser.email ?? "you"}</span>
                  </span>
                  <SignOutButton />
                </div>
              ) : (
                <Link
                  href="/sign-in"
                  className="ml-2 rounded-md bg-forest px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-paper hover:bg-cocoa"
                >
                  Sign in
                </Link>
              )
            ) : null}
          </div>
        </nav>
        {isDemoMode ? (
          <div className="border-t border-cocoa/10 bg-sage/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-forest">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-editorial text-sm normal-case tracking-normal text-forest">Demo mode</span>
              <span>Mock provider only</span>
              <span>No real checkout</span>
              <span>No Swiggy API calls</span>
              <span>Actor switching is demo-only</span>
            </div>
          </div>
        ) : null}
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-10">{children}</main>
      <BottomNav />
    </div>
  );
}
