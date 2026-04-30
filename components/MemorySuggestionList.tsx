"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { MemorySuggestion } from "@/lib/services/memory-service";
import { AddMemorySuggestionButton } from "./AddMemorySuggestionButton";
import { EmptyState } from "./EmptyState";
import { MemorySuggestionCard } from "./MemorySuggestionCard";
import { StatusPill } from "./StatusPill";

export function MemorySuggestionList({
  householdId,
  actorId,
  suggestions,
  emptyTitle,
  emptyDescription
}: {
  householdId: string;
  actorId: string;
  suggestions: MemorySuggestion[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visibleSuggestions = useMemo(() => suggestions.filter((suggestion) => !dismissed.includes(suggestion.id)), [dismissed, suggestions]);

  if (!visibleSuggestions.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {visibleSuggestions.map((suggestion) => (
        <MemorySuggestionCard
          key={suggestion.id}
          title={suggestion.displayName}
          detail={suggestion.reason}
          action={
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={suggestion.isFallback ? "neutral" : "approved"}>{suggestion.isFallback ? "Setup example" : `${Math.round(suggestion.confidence * 100)}% confidence`}</StatusPill>
                {suggestion.suggestedQuantity ? (
                  <StatusPill tone="cart">
                    {suggestion.suggestedQuantity} {suggestion.suggestedUnit ?? ""}
                  </StatusPill>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <AddMemorySuggestionButton householdId={householdId} actorId={actorId} suggestion={suggestion} />
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-cocoa/15 bg-paper/60 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cocoa hover:bg-cream"
                  onClick={() => setDismissed((current) => [...current, suggestion.id])}
                >
                  <X className="h-3.5 w-3.5" />
                  Dismiss
                </button>
                <button
                  type="button"
                  disabled
                  title="Persistent memory editing will come after memory controls have a durable schema."
                  className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-md border border-cocoa/10 bg-paper/30 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-bark opacity-60"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Edit memory
                </button>
              </div>
            </div>
          }
        />
      ))}
    </div>
  );
}
