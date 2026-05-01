import { AlertCircle, CheckCircle2, ListPlus, ShoppingCart } from "lucide-react";
import { GroceryGroupedList } from "@/components/GroceryGroupedList";
import { CurrentActorSwitcher } from "@/components/CurrentActorSwitcher";
import { HouseholdSwitcher } from "@/components/HouseholdSwitcher";
import { PageHeader } from "@/components/PageHeader";
import { PreservedQueryLink } from "@/components/PreservedQueryLink";
import { PrepareCartButton } from "@/components/PrepareCartButton";
import { RecurringSuggestionsPanel } from "@/components/RecurringSuggestionsPanel";
import { StatusPill } from "@/components/StatusPill";
import { SummaryCard } from "@/components/SummaryCard";
import { findDuplicateHints } from "@/lib/grocery/duplicate-hints";
import { prisma } from "@/lib/prisma";
import { getDefaultHouseholdId, resolveCurrentActorId } from "@/lib/services/household-service";
import { getHouseholdRole, roleCapabilities } from "@/lib/services/permissions-service";

export const dynamic = "force-dynamic";

export default async function GroceryPage({ searchParams }: { searchParams: Promise<{ householdId?: string; actorId?: string }> }) {
  const params = await searchParams;
  const households = await prisma.household.findMany({ orderBy: { createdAt: "asc" } });
  const householdId = params.householdId ?? households[0]?.id ?? (await getDefaultHouseholdId());
  const actorId = await resolveCurrentActorId(householdId, params.actorId);
  const [members, role] = await Promise.all([
    prisma.householdMember.findMany({
      where: { householdId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" }
    }),
    getHouseholdRole(householdId, actorId)
  ]);
  const permissions = roleCapabilities(role);
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
  const duplicateHints = findDuplicateHints(requests);

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <PageHeader
          eyebrow="Grocery memory"
          title="Household List"
          meta={`${requests.length} items`}
          description="Review every request by category, keep duplicates visible, and approve only what should move toward a cart."
        />
        <div className="grid gap-3">
          <HouseholdSwitcher households={households} currentHouseholdId={householdId} />
          <CurrentActorSwitcher members={members} currentActorId={actorId} />
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Total requests" value={requests.length} detail="Across all statuses" tone="lavender" icon={ListPlus} />
        <SummaryCard label="Needs approval" value={pendingCount} detail="Waiting for admin" tone="peach" icon={AlertCircle} />
        <SummaryCard label="Approved" value={approvedCount} detail="Ready for mock cart" tone="sage" icon={CheckCircle2} />
        <SummaryCard label="Urgent" value={urgentCount} detail="Prioritize today" tone="paper" icon={ShoppingCart} />
      </section>

      {duplicateHints.length ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cocoa/10 bg-peach/45 p-5 shadow-panel">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="cart">Duplicate hint</StatusPill>
              <p className="font-semibold text-cocoa">{formatDuplicateNames(duplicateHints[0].names)} look similar. Merge?</p>
            </div>
            <p className="mt-2 text-sm text-bark">Review these synonym matches before merging household requests.</p>
          </div>
          <PreservedQueryLink className="rounded-md border border-cocoa/20 bg-paper px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cocoa hover:bg-cream" href="/add">
            Add request
          </PreservedQueryLink>
        </section>
      ) : null}

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cocoa/10 bg-paper p-5 shadow-panel">
        <p className="text-sm text-bark">
          {approvedCount >= 5 || urgentCount > 0
            ? `You have ${approvedCount} approved items${urgentCount ? ` and ${urgentCount} urgent item` : ""}. A cart is ready to prepare.`
            : "Approve items first, then prepare a mock cart for review."}
        </p>
        {permissions.canPrepareCart ? (
          <PrepareCartButton householdId={householdId} actorId={actorId} disabled={approvedCount === 0} />
        ) : (
          <p className="max-w-sm text-sm font-semibold text-bark">Only household admins can prepare mock carts.</p>
        )}
      </section>

      <RecurringSuggestionsPanel suggestions={recurringPatterns} />
      <GroceryGroupedList requests={requests} actorId={actorId} canUseAdminActions={permissions.canApproveGrocery || permissions.canEditGrocery} />
    </div>
  );
}

function formatDuplicateNames(names: string[]) {
  const [first, second] = names;
  return [first, second].filter(Boolean).join(" and ");
}
