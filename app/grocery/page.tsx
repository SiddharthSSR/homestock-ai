import { HouseholdSwitcher } from "@/components/HouseholdSwitcher";
import { GroceryGroupedList } from "@/components/GroceryGroupedList";
import { GroceryInputBox } from "@/components/GroceryInputBox";
import { PrepareCartButton } from "@/components/PrepareCartButton";
import { RecurringSuggestionsPanel } from "@/components/RecurringSuggestionsPanel";
import { prisma } from "@/lib/prisma";
import { getDefaultActorId, getDefaultHouseholdId } from "@/lib/services/household-service";

export const dynamic = "force-dynamic";

export default async function GroceryPage({ searchParams }: { searchParams: Promise<{ householdId?: string }> }) {
  const params = await searchParams;
  const actorId = await getDefaultActorId();
  const households = await prisma.household.findMany({ orderBy: { createdAt: "asc" } });
  const householdId = params.householdId ?? households[0]?.id ?? (await getDefaultHouseholdId());
  const requests = await prisma.groceryRequest.findMany({
    where: { householdId },
    orderBy: [{ status: "asc" }, { category: "asc" }, { createdAt: "desc" }]
  });
  const recurringPatterns = await prisma.recurringPattern.findMany({
    where: { householdId },
    include: { groceryItem: true },
    orderBy: { confidenceScore: "desc" }
  });
  const approvedCount = requests.filter((request) => request.status === "APPROVED").length;
  const urgentCount = requests.filter((request) => request.urgency === "HIGH" && request.status === "APPROVED").length;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Grocery memory</h1>
          <p className="mt-1 text-sm text-slate-600">Requests are grouped by category and kept separate from checkout.</p>
        </div>
        <HouseholdSwitcher households={households} currentHouseholdId={householdId} />
      </div>

      <GroceryInputBox householdId={householdId} actorId={actorId} />

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <p className="text-sm text-slate-700">
          {approvedCount >= 5 || urgentCount > 0
            ? `You have ${approvedCount} approved items${urgentCount ? ` and ${urgentCount} urgent item` : ""}. A cart is ready to prepare.`
            : `Approve at least 5 items or mark an approved item urgent before preparing a cart.`}
        </p>
        <PrepareCartButton householdId={householdId} actorId={actorId} disabled={approvedCount === 0} />
      </section>

      <RecurringSuggestionsPanel suggestions={recurringPatterns} />
      <GroceryGroupedList requests={requests} actorId={actorId} />
    </div>
  );
}
