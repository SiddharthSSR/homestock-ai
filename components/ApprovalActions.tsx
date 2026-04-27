"use client";

import { Check, Pencil, ShoppingBag, X } from "lucide-react";
import { useState } from "react";

export function ApprovalActions({ requestId, actorId, showSecondaryActions = true }: { requestId: string; actorId: string; showSecondaryActions?: boolean }) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function mutate(path: string) {
    setError(null);
    setPendingAction(path);

    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId })
      });

      if (!response.ok) throw new Error("Could not update grocery request.");
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update grocery request.");
      setPendingAction(null);
    }
  }

  async function edit() {
    const quantity = window.prompt("Quantity");
    if (quantity === null) return;
    setError(null);
    setPendingAction("edit");

    try {
      const response = await fetch(`/api/grocery-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId, quantity: quantity ? Number(quantity) : null })
      });

      if (!response.ok) throw new Error("Could not edit grocery request.");
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not edit grocery request.");
      setPendingAction(null);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          title="Approve"
          aria-label="Approve grocery request"
          disabled={Boolean(pendingAction)}
          className="inline-flex items-center gap-2 rounded-md bg-forest px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-paper hover:bg-cocoa disabled:cursor-not-allowed disabled:bg-bark/30"
          onClick={() => mutate(`/api/grocery-requests/${requestId}/approve`)}
        >
          <Check className="h-4 w-4" />
          {pendingAction?.includes("approve") ? "Approving..." : "Approve"}
        </button>
        <button
          type="button"
          title="Reject"
          aria-label="Reject grocery request"
          disabled={Boolean(pendingAction)}
          className="inline-flex items-center gap-2 rounded-md border border-cocoa/15 bg-paper px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cocoa hover:bg-oat disabled:cursor-not-allowed disabled:text-bark/40"
          onClick={() => mutate(`/api/grocery-requests/${requestId}/reject`)}
        >
          <X className="h-4 w-4" />
          {pendingAction?.includes("reject") ? "Rejecting..." : "Reject"}
        </button>
        {showSecondaryActions ? (
          <>
            <button type="button" title="Edit quantity" aria-label="Edit grocery request quantity" disabled={Boolean(pendingAction)} className="rounded-md border border-cocoa/15 bg-paper p-2 text-cocoa hover:bg-oat disabled:cursor-not-allowed disabled:text-bark/40" onClick={edit}>
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Purchased offline"
              aria-label="Mark grocery request as purchased offline"
              disabled={Boolean(pendingAction)}
              className="rounded-md border border-cocoa/15 bg-paper p-2 text-cocoa hover:bg-oat disabled:cursor-not-allowed disabled:text-bark/40"
              onClick={() => mutate(`/api/grocery-requests/${requestId}/purchased-offline`)}
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          </>
        ) : null}
      </div>
      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
