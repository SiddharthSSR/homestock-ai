import Link from "next/link";
import { AlertCircle, CheckCircle2, ListPlus, ShoppingCart } from "lucide-react";
import { GroceryGroupedList } from "@/components/GroceryGroupedList";
import { HouseholdSwitcher } from "@/components/HouseholdSwitcher";
import { PageHeader } from "@/components/PageHeader";
import { PrepareCartButton } from "@/components/PrepareCartButton";
import { RecurringSuggestionsPanel } from "@/components/RecurringSuggestionsPanel";
import { StatusPill } from "@/components/StatusPill";
import { SummaryCard } from "@/components/SummaryCard";
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
    include: { requester: { select: { name: true } } },
    orderBy: [{ status: "asc" }, { category: "asc" }, { createdAt: "desc" }]
  });
  const recurringPatterns = await prisma.recurringPattern.findMany({
    where: { householdId },
    include: { groceryItem: true },
    orderBy: { confidenceScore: "desc" }
  });
  const approvedCount = requests.filter((request) => request.status === "APPROVED").length;
  const pendingCount = requests.filter((request) => request.status === "PENDING").length;
  const urgentCount = requests.filter((request) => request.urgency === "HIGH" && request.status !== "REJECTED").length;

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <PageHeader
          eyebrow="Grocery memory"
          title="Household List"
          meta={`${requests.length} items`}
          description="Review every request by category, keep duplicates visible, and approve only what should move toward a cart."
        />
        <HouseholdSwitcher households={households} currentHouseholdId={householdId} />
      </div>

      <section className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Total requests" value={requests.length} detail="Across all statuses" tone="lavender" icon={ListPlus} />
        <SummaryCard label="Needs approval" value={pendingCount} detail="Waiting for admin" tone="peach" icon={AlertCircle} />
        <SummaryCard label="Approved" value={approvedCount} detail="Ready for mock cart" tone="sage" icon={CheckCircle2} />
        <SummaryCard label="Urgent" value={urgentCount} detail="Prioritize today" tone="paper" icon={ShoppingCart} />
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cocoa/10 bg-peach/45 p-5 shadow-panel">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="cart">Duplicate hint</StatusPill>
            <p className="font-semibold text-cocoa">Dahi and curd look similar. Merge?</p>
          </div>
          <p className="mt-2 text-sm text-bark">This is the review pattern for synonym matches before automatic merges become configurable.</p>
        </div>
        <Link className="rounded-md border border-cocoa/20 bg-paper px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cocoa hover:bg-cream" href="/add">
          Add request
        </Link>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cocoa/10 bg-paper p-5 shadow-panel">
        <p className="text-sm text-bark">
          {approvedCount >= 5 || urgentCount > 0
            ? `You have ${approvedCount} approved items${urgentCount ? ` and ${urgentCount} urgent item` : ""}. A cart is ready to prepare.`
            : "Approve items first, then prepare a mock cart for review."}
        </p>
        <PrepareCartButton householdId={householdId} actorId={actorId} disabled={approvedCount === 0} />
      </section>

      <RecurringSuggestionsPanel suggestions={recurringPatterns} />
      <GroceryGroupedList requests={requests} actorId={actorId} />
    </div>
  );
}
