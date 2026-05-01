"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { MemorySuggestion } from "@/lib/services/memory-service";

export function DismissMemorySuggestionButton({
  householdId,
  actorId,
  suggestion,
  onDismissed
}: {
  householdId: string;
  actorId: string;
  suggestion: MemorySuggestion;
  onDismissed: (suggestionId: string) => void;
}) {
  const [state, setState] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);

  async function dismissSuggestion() {
    setState("saving");
    setError(null);

    try {
      const response = await fetch(`/api/households/${householdId}/memory/dismissals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorId,
          suggestionKey: suggestion.id,
          canonicalName: suggestion.canonicalName,
          displayName: suggestion.displayName,
          suggestionType: suggestion.type,
          source: suggestion.source,
          reason: suggestion.reason,
          dismissDays: 7
        })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not dismiss suggestion.");
      }

      onDismissed(suggestion.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not dismiss suggestion.");
      setState("idle");
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={state !== "idle"}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-cocoa/15 bg-paper/60 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cocoa hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60"
        onClick={dismissSuggestion}
      >
        <X className="h-3.5 w-3.5" />
        {state === "saving" ? "Dismissing..." : "Dismiss"}
      </button>
      {error ? <p className="text-xs font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
