import type { GroceryRequest } from "@prisma/client";
import { CategorySection } from "./CategorySection";
import { EmptyState } from "./EmptyState";
import { GroceryItemCard } from "./GroceryItemCard";

export function GroceryGroupedList({ requests, actorId }: { requests: GroceryRequest[]; actorId: string }) {
  const grouped = requests.reduce<Record<string, GroceryRequest[]>>((acc, request) => {
    acc[request.category] = acc[request.category] ?? [];
    acc[request.category].push(request);
    return acc;
  }, {});

  if (!requests.length) {
    return <EmptyState title="No grocery requests yet" description="Add a natural language request to start the shared household list." />;
  }

  return (
    <div className="grid gap-5">
      {Object.entries(grouped).map(([category, categoryRequests]) => (
        <CategorySection key={category} title={category} count={categoryRequests.length}>
          <div className="grid gap-3 md:grid-cols-2">
            {categoryRequests.map((request) => (
              <GroceryItemCard key={request.id} request={request} actorId={actorId} />
            ))}
          </div>
        </CategorySection>
      ))}
    </div>
  );
}
