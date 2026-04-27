"use client";

import { CheckCheck, XCircle } from "lucide-react";
import { useState } from "react";

export function BulkApprovalActions({ requestIds, actorId }: { requestIds: string[]; actorId: string }) {
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function mutateAll(action: "approve" | "reject") {
    setPendingAction(action);
    setError(null);

    try {
      const responses = await Promise.all(
        requestIds.map((requestId) =>
          fetch(`/api/grocery-requests/${requestId}/${action}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ actorId })
          })
        )
      );

      if (responses.some((response) => !response.ok)) {
        throw new Error("Could not update every grocery request.");
      }

      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update every grocery request.");
      setPendingAction(null);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!requestIds.length || Boolean(pendingAction)}
          className="inline-flex items-center gap-2 rounded-md bg-forest px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-paper hover:bg-cocoa disabled:cursor-not-allowed disabled:bg-bark/30"
          onClick={() => mutateAll("approve")}
        >
          <CheckCheck className="h-4 w-4" />
          {pendingAction === "approve" ? "Approving..." : "Approve all"}
        </button>
        <button
          type="button"
          disabled={!requestIds.length || Boolean(pendingAction)}
          className="inline-flex items-center gap-2 rounded-md border border-cocoa/15 bg-paper px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cocoa hover:bg-oat disabled:cursor-not-allowed disabled:text-bark/40"
          onClick={() => mutateAll("reject")}
        >
          <XCircle className="h-4 w-4" />
          {pendingAction === "reject" ? "Rejecting..." : "Reject all"}
        </button>
      </div>
      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
