"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";

export function CartApprovalPanel({ cartId, actorId, disabled }: { cartId: string; actorId: string; disabled?: boolean }) {
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setIsApproving(true);
    setError(null);

    try {
      const response = await fetch(`/api/carts/${cartId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not approve cart draft.");
      }

      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not approve cart draft.");
      setIsApproving(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={disabled || isApproving}
        aria-label="Approve cart draft"
        className="inline-flex items-center justify-center gap-2 rounded-md bg-forest px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-paper hover:bg-cocoa disabled:cursor-not-allowed disabled:bg-bark/30"
        onClick={approve}
      >
        <CheckCircle className="h-4 w-4" />
        {isApproving ? "Approving..." : "Approve cart"}
      </button>
      {error ? <p className="max-w-xs text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
