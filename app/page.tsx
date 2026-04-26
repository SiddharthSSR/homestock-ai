import Link from "next/link";
import { ClipboardList, Home, ShoppingCart } from "lucide-react";

export default function HomePage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
        <p className="text-sm font-medium uppercase tracking-wide text-leaf">Shared grocery memory</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold text-ink">Capture requests, approve what matters, prepare a cart only when the household is ready.</h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Phase 1 runs on local household memory and a mock commerce provider. Swiggy Instamart remains behind a provider stub until official Builders Club MCP access is configured.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/household" className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel hover:border-leaf">
          <Home className="h-5 w-5 text-leaf" />
          <h2 className="mt-3 font-semibold text-ink">Household</h2>
          <p className="mt-2 text-sm text-slate-600">Create the household and assign admin, member, and cook roles.</p>
        </Link>
        <Link href="/grocery" className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel hover:border-leaf">
          <ClipboardList className="h-5 w-5 text-leaf" />
          <h2 className="mt-3 font-semibold text-ink">Grocery Memory</h2>
          <p className="mt-2 text-sm text-slate-600">Add natural language requests and review grouped pending items.</p>
        </Link>
        <Link href="/cart" className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel hover:border-leaf">
          <ShoppingCart className="h-5 w-5 text-leaf" />
          <h2 className="mt-3 font-semibold text-ink">Mock Cart</h2>
          <p className="mt-2 text-sm text-slate-600">Prepare a provider-backed draft after request approval.</p>
        </Link>
      </section>
    </div>
  );
}
