"use client";

import type { CartItem } from "@prisma/client";
import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { StatusPill } from "./StatusPill";

export function CartItemCard({ item, actorId, editable = false }: { item: CartItem; actorId: string; editable?: boolean }) {
  const [quantity, setQuantity] = useState(item.quantity?.toString() ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateQuantity() {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/cart-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId, quantity: quantity.trim() ? Number(quantity) : null })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not update cart item.");
      }

      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update cart item.");
      setIsSaving(false);
    }
  }

  async function removeItem() {
    setIsRemoving(true);
    setError(null);

    try {
      const response = await fetch(`/api/cart-items/${item.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not remove cart item.");
      }

      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove cart item.");
      setIsRemoving(false);
    }
  }

  return (
    <article className="rounded-lg border border-cocoa/10 bg-paper p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-cocoa">{item.productName}</h3>
          <p className="mt-1 text-sm text-bark">
            {item.brand ?? "Mock Essentials"} · {item.unit ?? "Unit not set"}
          </p>
        </div>
        <StatusPill tone={item.availabilityStatus === "AVAILABLE" ? "approved" : item.availabilityStatus === "SUBSTITUTED" ? "cart" : "pending"}>
          {item.availabilityStatus}
        </StatusPill>
      </div>
      {item.substitutionReason ? <p className="mt-3 rounded-md bg-peach/35 px-3 py-2 text-sm text-cocoa">{item.substitutionReason}</p> : null}
      <div className="mt-4 grid gap-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-bark">Requested quantity</p>
        <p className="text-sm text-cocoa">{item.quantity ?? "Qty not set"}</p>
      </div>
      <p className="font-editorial mt-4 text-3xl text-cocoa">₹{item.price.toFixed(0)}</p>
      <p className="mt-1 text-xs text-bark">Mock estimate for selected product package.</p>

      {editable ? (
        <div className="mt-4 grid gap-3 rounded-lg border border-cocoa/10 bg-cream p-3">
          <label className="grid gap-1 text-sm">
            <span className="font-bold uppercase tracking-[0.16em] text-bark">Adjust requested qty</span>
            <input
              className="rounded-md border border-cocoa/10 bg-paper px-3 py-2 text-cocoa"
              min="0"
              step="0.25"
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="Qty"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md bg-cocoa px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-paper hover:bg-forest disabled:cursor-not-allowed disabled:bg-bark/30"
              disabled={isSaving || isRemoving}
              onClick={updateQuantity}
            >
              <Save className="h-3.5 w-3.5" />
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving || isRemoving}
              onClick={removeItem}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isRemoving ? "Removing..." : "Remove"}
            </button>
          </div>
          {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
        </div>
      ) : null}
    </article>
  );
}
