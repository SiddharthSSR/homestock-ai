import type { GroceryRequest } from "@prisma/client";
import { CategorySection } from "./CategorySection";
import { EmptyState } from "./EmptyState";
import { GroceryItemCard } from "./GroceryItemCard";

type GroceryRequestWithRequester = GroceryRequest & {
  requester?: {
    name: string;
  };
};

const primaryCategories = ["Vegetables", "Dairy", "Staples", "Cooking", "Household"];

export function GroceryGroupedList({ requests, actorId, canUseAdminActions = true }: { requests: GroceryRequestWithRequester[]; actorId: string; canUseAdminActions?: boolean }) {
  const grouped = requests.reduce<Record<string, GroceryRequest[]>>((acc, request) => {
    const category = request.category === "Other" ? "Household" : request.category;
    acc[category] = acc[category] ?? [];
    acc[category].push(request);
    return acc;
  }, {});

  if (!requests.length) {
    return <EmptyState title="No grocery requests yet" description="Add a natural language request to start the shared household list." />;
  }

  const categories = [...primaryCategories, ...Object.keys(grouped).filter((category) => !primaryCategories.includes(category))];

  return (
    <div className="grid gap-5">
      {categories.map((category) => {
        const categoryRequests = grouped[category] ?? [];
        return (
        <CategorySection key={category} title={category} count={categoryRequests.length}>
          {categoryRequests.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {categoryRequests.map((request) => (
                <GroceryItemCard key={request.id} request={request} actorId={actorId} canUseAdminActions={canUseAdminActions} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-cocoa/15 bg-paper/70 p-4 text-sm text-bark">No {category.toLowerCase()} requests right now.</div>
          )}
        </CategorySection>
        );
      })}
    </div>
  );
}
