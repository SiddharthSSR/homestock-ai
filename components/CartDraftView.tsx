import type { CartDraft, CartItem } from "@prisma/client";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { CartItemCard } from "./CartItemCard";
import { CartApprovalPanel } from "./CartApprovalPanel";
import { StatusPill } from "./StatusPill";

type CartWithItems = CartDraft & {
  items: CartItem[];
};

export function CartDraftView({ cart, actorId }: { cart: CartWithItems; actorId: string }) {
  const substitutedItems = cart.items.filter((item) => item.availabilityStatus === "SUBSTITUTED");
  const unavailableItems = cart.items.filter((item) => item.availabilityStatus === "UNAVAILABLE");

  return (
    <article className="rounded-[1.5rem] border border-cocoa/10 bg-paper p-5 shadow-editorial">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-bark">Cart draft</p>
          <h2 className="font-editorial mt-2 text-4xl font-semibold text-cocoa">Admin review</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill tone="cart">{cart.provider.replace("_", " ")}</StatusPill>
            <StatusPill tone={cart.status === "APPROVED" ? "approved" : "pending"}>{cart.status.replaceAll("_", " ")}</StatusPill>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-bark">Estimated total</p>
          <p className="font-editorial mt-2 text-5xl text-cocoa">₹{cart.estimatedTotal.toFixed(0)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-cocoa/10 bg-cream p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-bark">Provider status</p>
          <p className="mt-2 font-semibold text-cocoa">Mock mode active</p>
          <p className="mt-1 text-sm text-bark">Swiggy is not connected. Prices and availability are mock estimates.</p>
        </div>
        <div className="rounded-lg border border-cocoa/10 bg-lavender/60 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-bark">Substitutions</p>
          <p className="font-editorial mt-2 text-4xl text-cocoa">{substitutedItems.length}</p>
        </div>
        <div className="rounded-lg border border-cocoa/10 bg-peach/60 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-bark">Unavailable</p>
          <p className="font-editorial mt-2 text-4xl text-cocoa">{unavailableItems.length}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {cart.items.map((item) => (
          <CartItemCard key={item.id} item={item} />
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-forest/15 bg-sage p-5 text-forest">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0" />
            <div>
              <p className="font-editorial text-3xl font-semibold">Final admin approval</p>
              <p className="mt-2 text-sm leading-6 text-forest/80">Approving this cart only marks the draft approved in HomeStock AI. It does not place a real order in mock mode.</p>
            </div>
          </div>
          <CartApprovalPanel cartId={cart.id} actorId={actorId} disabled={cart.status === "APPROVED"} />
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-peachDeep/25 bg-peach/40 p-3 text-sm text-cocoa">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Mock provider only. No checkout, payment, Swiggy account action, or order placement will happen.</p>
      </div>
    </article>
  );
}
