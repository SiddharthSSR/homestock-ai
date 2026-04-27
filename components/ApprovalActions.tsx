"use client";

import { Check, Pencil, ShoppingBag, X } from "lucide-react";

export function ApprovalActions({ requestId, actorId }: { requestId: string; actorId: string }) {
  async function mutate(path: string) {
    await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorId })
    });
    window.location.reload();
  }

  async function edit() {
    const quantity = window.prompt("Quantity");
    if (quantity === null) return;
    await fetch(`/api/grocery-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorId, quantity: quantity ? Number(quantity) : null })
    });
    window.location.reload();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        title="Approve"
        aria-label="Approve grocery request"
        className="inline-flex items-center gap-2 rounded-md bg-forest px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-paper hover:bg-cocoa"
        onClick={() => mutate(`/api/grocery-requests/${requestId}/approve`)}
      >
        <Check className="h-4 w-4" />
        Approve
      </button>
      <button type="button" title="Reject" aria-label="Reject grocery request" className="rounded-md border border-cocoa/15 bg-paper p-2 text-cocoa hover:bg-oat" onClick={() => mutate(`/api/grocery-requests/${requestId}/reject`)}>
        <X className="h-4 w-4" />
      </button>
      <button type="button" title="Edit quantity" aria-label="Edit grocery request quantity" className="rounded-md border border-cocoa/15 bg-paper p-2 text-cocoa hover:bg-oat" onClick={edit}>
        <Pencil className="h-4 w-4" />
      </button>
      <button type="button" title="Purchased offline" aria-label="Mark grocery request as purchased offline" className="rounded-md border border-cocoa/15 bg-paper p-2 text-cocoa hover:bg-oat" onClick={() => mutate(`/api/grocery-requests/${requestId}/purchased-offline`)}>
        <ShoppingBag className="h-4 w-4" />
      </button>
    </div>
  );
}
