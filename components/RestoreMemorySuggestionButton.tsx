"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

export function RestoreMemorySuggestionButton({
  householdId,
  actorId,
  dismissalId
}: {
  householdId: string;
  actorId: string;
  dismissalId: string;
}) {
  const [state, setState] = useState<"idle" | "saving" | "restored">("idle");
  const [error, setError] = useState<string | null>(null);

  async function restoreSuggestion() {
    setState("saving");
    setError(null);

    try {
      const response = await fetch(`/api/households/${householdId}/memory/dismissals/${dismissalId}?actorId=${actorId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not restore suggestion.");
      }

      setState("restored");
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not restore suggestion.");
      setState("idle");
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={state !== "idle"}
        onClick={restoreSuggestion}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-forest/25 bg-paper px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-forest hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        {state === "restored" ? "Restored" : state === "saving" ? "Restoring..." : "Restore"}
      </button>
      {error ? <p className="text-xs font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
