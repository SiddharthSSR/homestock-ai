"use client";

import { CheckCircle } from "lucide-react";

export function CartApprovalPanel({ cartId, actorId, disabled }: { cartId: string; actorId: string; disabled?: boolean }) {
  async function approve() {
    await fetch(`/api/carts/${cartId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorId })
    });
    window.location.reload();
  }

  return (
    <button
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-md bg-forest px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-paper hover:bg-cocoa disabled:cursor-not-allowed disabled:bg-bark/30"
      onClick={approve}
    >
      <CheckCircle className="h-4 w-4" />
      Approve cart
    </button>
  );
}
