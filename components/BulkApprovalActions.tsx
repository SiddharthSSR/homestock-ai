"use client";

import { CheckCheck, XCircle } from "lucide-react";

export function BulkApprovalActions({ requestIds, actorId }: { requestIds: string[]; actorId: string }) {
  async function mutateAll(action: "approve" | "reject") {
    await Promise.all(
      requestIds.map((requestId) =>
        fetch(`/api/grocery-requests/${requestId}/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actorId })
        })
      )
    );
    window.location.reload();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={!requestIds.length}
        className="inline-flex items-center gap-2 rounded-md bg-forest px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-paper hover:bg-cocoa disabled:cursor-not-allowed disabled:bg-bark/30"
        onClick={() => mutateAll("approve")}
      >
        <CheckCheck className="h-4 w-4" />
        Approve all
      </button>
      <button
        type="button"
        disabled={!requestIds.length}
        className="inline-flex items-center gap-2 rounded-md border border-cocoa/15 bg-paper px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cocoa hover:bg-oat disabled:cursor-not-allowed disabled:text-bark/40"
        onClick={() => mutateAll("reject")}
      >
        <XCircle className="h-4 w-4" />
        Reject all
      </button>
    </div>
  );
}
