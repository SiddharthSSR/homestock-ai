import type { RecurringPattern, GroceryItem } from "@prisma/client";

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
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <h2 className="text-lg font-semibold text-ink">Recurring suggestions</h2>
      <div className="mt-3 grid gap-2">
        {due.length ? (
          due.map((suggestion) => {
            const daysSince = suggestion.lastOrderedAt ? Math.floor((Date.now() - suggestion.lastOrderedAt.getTime()) / (24 * 60 * 60 * 1000)) : null;
            return (
              <p key={suggestion.id} className="rounded-md bg-skywash px-3 py-2 text-sm text-slate-700">
                {suggestion.groceryItem.displayName} is usually ordered every {suggestion.averageIntervalDays} days. Last ordered {daysSince} days ago.
              </p>
            );
          })
        ) : (
          <p className="text-sm text-slate-600">No recurring items are due right now.</p>
        )}
      </div>
    </section>
  );
}
