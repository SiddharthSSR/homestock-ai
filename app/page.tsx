import { AlertCircle, CheckCircle2, IndianRupee, ListChecks } from "lucide-react";
import { AddMemorySuggestionButton } from "@/components/AddMemorySuggestionButton";
import { CategorySection } from "@/components/CategorySection";
import { CurrentActorSwitcher } from "@/components/CurrentActorSwitcher";
import { EmptyState } from "@/components/EmptyState";
import { MemorySuggestionCard } from "@/components/MemorySuggestionCard";
import { PageHeader } from "@/components/PageHeader";
import { PreservedQueryLink } from "@/components/PreservedQueryLink";
import { ReminderList } from "@/components/ReminderList";
import { StatusPill } from "@/components/StatusPill";
import { SummaryCard } from "@/components/SummaryCard";
import { resolveSelectedHousehold } from "@/lib/household-selection";
import { prisma } from "@/lib/prisma";
import { getHouseholdReminders } from "@/lib/services/reminder-service";
import { getHouseholdMemory } from "@/lib/services/memory-service";
import { getDefaultHouseholdId, resolveCurrentActorId } from "@/lib/services/household-service";
import { getHouseholdRole, roleCapabilities } from "@/lib/services/permissions-service";

export const dynamic = "force-dynamic";

const demoActivity = [
  {
    title: "Cook added tomato, onion, oil",
    meta: "Today",
    status: "Pending"
  },
  {
    title: "Curd and dahi were merged",
    meta: "Yesterday",
    status: "Memory"
  },
  {
    title: "Mock cart prepared for review",
    meta: "This week",
    status: "Approval"
  }
];

export default async function HomePage({ searchParams }: { searchParams: Promise<{ householdId?: string; actorId?: string }> }) {
  const params = await searchParams;
  const households = await prisma.household.findMany({ orderBy: { createdAt: "asc" } });
  const selectedHousehold = resolveSelectedHousehold(households, params.householdId);
  const fallbackHousehold = selectedHousehold ? null : await prisma.household.findUnique({ where: { id: await getDefaultHouseholdId() } });
  const household = selectedHousehold ?? fallbackHousehold;
  const actorId = household ? await resolveCurrentActorId(household.id, params.actorId) : "";
  const [members, role] = household
    ? await Promise.all([
        prisma.householdMember.findMany({
          where: { householdId: household.id },
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "asc" }
        }),
        getHouseholdRole(household.id, actorId)
      ])
    : [[], null];
  const permissions = roleCapabilities(role);
  const householdName = household?.name ?? "Sharma Family";
  const headerMeta = formatHeaderMeta(new Date());
  const [requestCounts, latestCart, memory, reminders] = household
    ? await Promise.all([
        prisma.groceryRequest.groupBy({
          by: ["status"],
          where: { householdId: household.id },
          _count: { _all: true }
        }),
        prisma.cartDraft.findFirst({
          where: { householdId: household.id },
          orderBy: { createdAt: "desc" }
        }),
        getHouseholdMemory(household.id),
        getHouseholdReminders({ householdId: household.id, actorId })
      ])
    : [[], null, null, []] as const;
  const itemsInList = requestCounts.reduce((total, row) => total + row._count._all, 0);
  const needsApproval = requestCounts.find((row) => row.status === "PENDING")?._count._all ?? 0;
  const runningLowItems = memory ? [...memory.dueSoon, ...memory.monthlyStaples].slice(0, 2) : [];

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Household"
        title={householdName}
        meta={headerMeta}
        description="A shared grocery memory for the household. Capture requests, remember recurring needs, and approve carts only when everyone is ready."
      >
        <div className="grid md:grid-cols-2">
          <SummaryCard label="Items in list" value={itemsInList} detail="Across grocery requests" tone="lavender" icon={ListChecks} />
          <SummaryCard
            label="Needs approval"
            value={needsApproval}
            detail="Admin review required"
            tone="peach"
            icon={AlertCircle}
            action={
              <PreservedQueryLink className="inline-flex rounded-md bg-peachDeep px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-paper hover:bg-cocoa" href={household ? `/approve?householdId=${household.id}&actorId=${actorId}` : "/approve"}>
                Review
              </PreservedQueryLink>
            }
          />
        </div>
      </PageHeader>

      {household ? <CurrentActorSwitcher members={members} currentActorId={actorId} /> : null}

      <CategorySection title="Needs Attention" count={reminders.length}>
        <ReminderList reminders={reminders.slice(0, 4)} />
        {reminders.length > 4 ? (
          <PreservedQueryLink className="justify-self-start rounded-md border border-cocoa/15 bg-paper px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cocoa hover:bg-cream" href="/notifications">
            View all reminders
          </PreservedQueryLink>
        ) : null}
      </CategorySection>

      <section className="grid gap-3 sm:grid-cols-2">
        <SummaryCard label="Estimated cart" value={latestCart ? `₹${latestCart.estimatedTotal.toFixed(0)}` : "₹0"} detail="Latest mock cart estimate" tone="paper" icon={IndianRupee} />
        <SummaryCard label="Running low" value={runningLowItems.length} detail={memory?.fallbackUsed ? "Setup examples" : "Based on household memory"} tone="sage" icon={CheckCircle2} />
      </section>

      <CategorySection title="Running Low" count={runningLowItems.length}>
        <div className="grid gap-3">
          {runningLowItems.map((item) => (
            <MemorySuggestionCard
              key={item.id}
              title={item.displayName}
              detail={`${item.category} · ${item.reason}`}
              action={
                household && permissions.canAddMemorySuggestion ? <AddMemorySuggestionButton householdId={household.id} actorId={actorId} suggestion={item} /> : <p className="text-sm font-semibold text-bark">Only household admins and members can add memory suggestions.</p>
              }
            />
          ))}
        </div>
      </CategorySection>

      <CategorySection title="Demo Activity">
        <div className="grid gap-3">
          {demoActivity.length ? (
            demoActivity.map((activity) => (
              <article key={activity.title} className="rounded-lg border border-cocoa/10 bg-paper p-4 shadow-panel">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-cocoa">{activity.title}</h3>
                    <p className="mt-1 text-sm text-bark">{activity.meta}</p>
                  </div>
                  <StatusPill tone="neutral">{activity.status}</StatusPill>
                </div>
              </article>
            ))
          ) : (
            <EmptyState title="No demo activity" description="Grocery requests and approvals will appear here." />
          )}
        </div>
      </CategorySection>
    </div>
  );
}

function formatHeaderMeta(date: Date) {
  const datePart = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "2-digit",
    timeZone: "Asia/Kolkata"
  }).format(date);
  const hour = Number(
    new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata"
    }).format(date)
  );

  const dayPart = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
  return `${datePart} ${dayPart}`;
}
