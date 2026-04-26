"use client";

import { Check, Pencil, ShoppingBag, X } from "lucide-react";

export function AdminApprovalPanel({ requestId, actorId }: { requestId: string; actorId: string }) {
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
      <button title="Approve" className="rounded-md border border-green-200 p-2 text-leaf hover:bg-green-50" onClick={() => mutate(`/api/grocery-requests/${requestId}/approve`)}>
        <Check className="h-4 w-4" />
      </button>
      <button title="Reject" className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50" onClick={() => mutate(`/api/grocery-requests/${requestId}/reject`)}>
        <X className="h-4 w-4" />
      </button>
      <button title="Edit quantity" className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-50" onClick={edit}>
        <Pencil className="h-4 w-4" />
      </button>
      <button title="Purchased offline" className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-50" onClick={() => mutate(`/api/grocery-requests/${requestId}/purchased-offline`)}>
        <ShoppingBag className="h-4 w-4" />
      </button>
    </div>
  );
}
