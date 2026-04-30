"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { MemorySuggestion } from "@/lib/services/memory-service";

export function AddMemorySuggestionButton({
  householdId,
  actorId,
  suggestion,
  className
}: {
  householdId: string;
  actorId: string;
  suggestion: MemorySuggestion;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function addSuggestion() {
    setState("saving");
    setError(null);

    try {
      const response = await fetch(`/api/households/${householdId}/memory/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorId,
          displayName: suggestion.displayName,
          canonicalName: suggestion.canonicalName,
          category: suggestion.category,
          suggestedQuantity: suggestion.suggestedQuantity,
          suggestedUnit: suggestion.suggestedUnit,
          reason: suggestion.reason
        })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not add suggestion.");
      }

      setState("saved");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add suggestion.");
      setState("idle");
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={state !== "idle"}
        onClick={addSuggestion}
        className={
          className ??
          "inline-flex items-center justify-center gap-2 rounded-md border border-forest/30 bg-paper px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-forest hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        <Plus className="h-3.5 w-3.5" />
        {state === "saved" ? "Added" : state === "saving" ? "Adding..." : suggestion.actionLabel}
      </button>
      {error ? <p className="text-xs font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
