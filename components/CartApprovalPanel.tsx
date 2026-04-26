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
      className="inline-flex items-center gap-2 rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      onClick={approve}
    >
      <CheckCircle className="h-4 w-4" />
      Approve cart
    </button>
  );
}
