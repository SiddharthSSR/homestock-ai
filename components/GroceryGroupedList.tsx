import type { GroceryRequest } from "@prisma/client";
import { GroceryItemCard } from "./GroceryItemCard";

export function GroceryGroupedList({ requests, actorId }: { requests: GroceryRequest[]; actorId: string }) {
  const grouped = requests.reduce<Record<string, GroceryRequest[]>>((acc, request) => {
    acc[request.category] = acc[request.category] ?? [];
    acc[request.category].push(request);
    return acc;
  }, {});

  if (!requests.length) {
    return <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">No grocery requests yet.</div>;
  }

  return (
    <div className="grid gap-5">
      {Object.entries(grouped).map(([category, categoryRequests]) => (
        <section key={category} className="grid gap-3">
          <h2 className="text-lg font-semibold text-ink">{category}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {categoryRequests.map((request) => (
              <GroceryItemCard key={request.id} request={request} actorId={actorId} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
