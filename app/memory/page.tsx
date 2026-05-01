import { CategorySection } from "@/components/CategorySection";
import { CurrentActorSwitcher } from "@/components/CurrentActorSwitcher";
import { HouseholdSwitcher } from "@/components/HouseholdSwitcher";
import { MemorySuggestionList } from "@/components/MemorySuggestionList";
import { PageHeader } from "@/components/PageHeader";
import { RestoreMemorySuggestionButton } from "@/components/RestoreMemorySuggestionButton";
import { StatusPill } from "@/components/StatusPill";
import { SummaryCard } from "@/components/SummaryCard";
import { prisma } from "@/lib/prisma";
import { getActiveMemoryDismissals, getHouseholdMemory } from "@/lib/services/memory-service";
import { getDefaultHouseholdId, resolveCurrentActorId } from "@/lib/services/household-service";
import { getHouseholdRole, roleCapabilities } from "@/lib/services/permissions-service";

export const dynamic = "force-dynamic";

export default async function MemoryPage({ searchParams }: { searchParams: Promise<{ householdId?: string; actorId?: string }> }) {
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
  const [memory, dismissals] = await Promise.all([getHouseholdMemory(householdId), getActiveMemoryDismissals(householdId)]);

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <PageHeader
          eyebrow="Memory"
          title="Household Grocery Brain"
          meta={`${memory.dueSoon.length + memory.monthlyStaples.length + memory.frequentItems.length} suggestions`}
          description="Review recurring suggestions, due-soon items, monthly staples, learned preferences, and cautious household memory controls."
        />
        <div className="grid gap-3">
          <HouseholdSwitcher households={households} currentHouseholdId={householdId} />
          <CurrentActorSwitcher members={members} currentActorId={actorId} />
        </div>
      </div>

      {memory.fallbackUsed ? (
        <section className="rounded-lg border border-cocoa/10 bg-peach/45 p-5 text-cocoa shadow-panel">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="neutral">Setup mode</StatusPill>
            <p className="font-semibold">HomeStock does not have enough household history yet.</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-bark">The suggestions below are starter examples, clearly marked as setup items. They are not learned claims about this household.</p>
        </section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Due soon" value={memory.dueSoon.length} detail="Needs review" tone="peach" />
        <SummaryCard label="Monthly staples" value={memory.monthlyStaples.length} detail="Likely restock items" tone="sage" />
        <SummaryCard label="Frequent items" value={memory.frequentItems.length} detail="Repeated activity" tone="lavender" />
        <SummaryCard label="Preferences" value={memory.learnedPreferences.length} detail="Brand or quantity memory" tone="paper" />
      </section>

      <CategorySection title="Due Soon" count={memory.dueSoon.length}>
        <MemorySuggestionList
          householdId={householdId}
          actorId={actorId}
          suggestions={memory.dueSoon}
          canAddSuggestions={permissions.canAddMemorySuggestion}
          canDismissSuggestions={permissions.canDismissMemorySuggestion}
          emptyTitle="Nothing due soon"
          emptyDescription="HomeStock will surface items here when repeated grocery history indicates they may be running low."
        />
      </CategorySection>

      <CategorySection title="Monthly Staples" count={memory.monthlyStaples.length}>
        <MemorySuggestionList
          householdId={householdId}
          actorId={actorId}
          suggestions={memory.monthlyStaples}
          canAddSuggestions={permissions.canAddMemorySuggestion}
          canDismissSuggestions={permissions.canDismissMemorySuggestion}
          emptyTitle="No monthly staples yet"
          emptyDescription="Items like atta, oil, rice, or spices will appear here after enough monthly activity is visible."
        />
      </CategorySection>

      <CategorySection title="Frequent Items" count={memory.frequentItems.length}>
        <MemorySuggestionList
          householdId={householdId}
          actorId={actorId}
          suggestions={memory.frequentItems}
          canAddSuggestions={permissions.canAddMemorySuggestion}
          canDismissSuggestions={permissions.canDismissMemorySuggestion}
          emptyTitle="No frequent items yet"
          emptyDescription="Repeated grocery requests and cart activity will become frequent item suggestions."
        />
      </CategorySection>

      <CategorySection title="Learned Preferences" count={memory.learnedPreferences.length}>
        <MemorySuggestionList
          householdId={householdId}
          actorId={actorId}
          suggestions={memory.learnedPreferences}
          canAddSuggestions={permissions.canAddMemorySuggestion}
          canDismissSuggestions={permissions.canDismissMemorySuggestion}
          emptyTitle="No learned preferences yet"
          emptyDescription="Preferred brands and usual quantities will appear when the household repeats cart choices."
        />
      </CategorySection>

      <section className="rounded-[1.5rem] border border-forest/15 bg-sage p-5 text-forest shadow-editorial">
        <p className="text-xs font-bold uppercase tracking-[0.24em]">Memory controls</p>
        <h2 className="font-editorial mt-2 text-3xl font-semibold">Cautious memory, admin controlled</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <MemoryControl title="Suggest reorders" detail="Enabled for simple recurring grocery patterns." />
          <MemoryControl title="Dismiss suggestions" detail="Dismissed suggestions are hidden for 7 days across memory and dashboard views." />
          <MemoryControl title="Auto-checkout" detail="Disabled. Orders always need explicit admin approval." />
        </div>
      </section>

      <CategorySection title="Dismissed Suggestions" count={dismissals.length}>
        {dismissals.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {dismissals.map((dismissal) => (
              <article key={dismissal.id} className="rounded-lg border border-cocoa/10 bg-paper p-4 shadow-panel">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-bark">{dismissal.suggestionType}</p>
                    <h3 className="font-editorial mt-2 text-2xl font-semibold text-cocoa">{dismissal.displayName}</h3>
                    <p className="mt-2 text-sm leading-6 text-bark">
                      Hidden until {dismissal.expiresAt ? formatMemoryDate(dismissal.expiresAt) : "restored"} · {dismissal.source}
                    </p>
                  </div>
                  <StatusPill tone="neutral">Dismissed</StatusPill>
                </div>
                {permissions.canDismissMemorySuggestion ? (
                  <div className="mt-4">
                    <RestoreMemorySuggestionButton householdId={householdId} actorId={actorId} dismissalId={dismissal.id} />
                  </div>
                ) : (
                  <p className="mt-4 text-sm font-semibold text-bark">Only household admins and members can restore dismissed suggestions.</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-cocoa/10 bg-paper p-5 text-sm text-bark shadow-panel">No active dismissals. Dismissed suggestions will appear here until they expire or are restored.</div>
        )}
      </CategorySection>
    </div>
  );
}

function MemoryControl({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-forest/15 bg-paper/70 p-4">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-forest/80">{detail}</p>
    </div>
  );
}

function formatMemoryDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "2-digit",
    timeZone: "Asia/Kolkata"
  }).format(date);
}
