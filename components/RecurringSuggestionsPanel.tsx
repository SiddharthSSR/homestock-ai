import type { RecurringPattern, GroceryItem } from "@prisma/client";
import { MemorySuggestionCard } from "./MemorySuggestionCard";

type Suggestion = RecurringPattern & {
  groceryItem: GroceryItem;
};

export function RecurringSuggestionsPanel({ suggestions }: { suggestions: Suggestion[] }) {
  const due = suggestions.filter((suggestion) => {
    if (!suggestion.lastOrderedAt) return false;
    const daysSince = Math.floor((Date.now() - suggestion.lastOrderedAt.getTime()) / (24 * 60 * 60 * 1000));
    return daysSince >= suggestion.averageIntervalDays;
  });

  return (
    <section className="rounded-lg border border-forest/15 bg-paper p-5 shadow-panel">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-bark">Memory</p>
      <h2 className="font-editorial mt-2 text-3xl font-semibold text-forest">Running low</h2>
      <div className="mt-3 grid gap-2">
        {due.length ? (
          due.map((suggestion) => {
            const daysSince = suggestion.lastOrderedAt ? Math.floor((Date.now() - suggestion.lastOrderedAt.getTime()) / (24 * 60 * 60 * 1000)) : null;
            return (
              <MemorySuggestionCard
                key={suggestion.id}
                title={suggestion.groceryItem.displayName}
                detail={`${suggestion.groceryItem.displayName} — usually expected every ${suggestion.averageIntervalDays} days. Last seen ${daysSince} days ago.`}
              />
            );
          })
        ) : (
          <p className="text-sm text-bark">No recurring items are due right now.</p>
        )}
      </div>
    </section>
  );
}
