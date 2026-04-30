"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";

export function PrepareCartButton({ householdId, actorId, disabled }: { householdId: string; actorId: string; disabled?: boolean }) {
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function prepare() {
    setIsPreparing(true);
    setError(null);

    try {
      const response = await fetch(`/api/households/${householdId}/cart/prepare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not prepare mock cart.");
      }

      window.location.href = `/cart?householdId=${householdId}`;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not prepare mock cart.");
      setIsPreparing(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={disabled || isPreparing}
        aria-label="Prepare mock cart"
        className="inline-flex items-center justify-center gap-2 rounded-md bg-cocoa px-4 py-2 text-sm font-bold uppercase tracking-[0.14em] text-paper hover:bg-forest disabled:cursor-not-allowed disabled:bg-bark/30"
        onClick={prepare}
      >
        <ShoppingCart className="h-4 w-4" />
        {isPreparing ? "Preparing..." : "Prepare mock cart"}
      </button>
      {error ? <p className="max-w-xs text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
