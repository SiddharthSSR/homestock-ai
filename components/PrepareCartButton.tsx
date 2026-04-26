"use client";

import { ShoppingCart } from "lucide-react";

export function PrepareCartButton({ householdId, actorId, disabled }: { householdId: string; actorId: string; disabled?: boolean }) {
  async function prepare() {
    await fetch(`/api/households/${householdId}/cart/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorId })
    });
    window.location.href = `/cart?householdId=${householdId}`;
  }

  return (
    <button
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      onClick={prepare}
    >
      <ShoppingCart className="h-4 w-4" />
      Prepare mock cart
    </button>
  );
}
