import { CategorySection } from "@/components/CategorySection";
import { HouseholdSwitcher } from "@/components/HouseholdSwitcher";
import { MemorySuggestionList } from "@/components/MemorySuggestionList";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { SummaryCard } from "@/components/SummaryCard";
import { prisma } from "@/lib/prisma";
import { getHouseholdMemory } from "@/lib/services/memory-service";
import { getDefaultActorId, getDefaultHouseholdId } from "@/lib/services/household-service";

export const dynamic = "force-dynamic";

export default async function MemoryPage({ searchParams }: { searchParams: Promise<{ householdId?: string }> }) {
  const params = await searchParams;
  const actorId = await getDefaultActorId();
  const households = await prisma.household.findMany({ orderBy: { createdAt: "asc" } });
  const householdId = params.householdId ?? households[0]?.id ?? (await getDefaultHouseholdId());
  const memory = await getHouseholdMemory(householdId);

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <PageHeader
          eyebrow="Memory"
          title="Household Grocery Brain"
          meta={`${memory.dueSoon.length + memory.monthlyStaples.length + memory.frequentItems.length} suggestions`}
          description="Review recurring suggestions, due-soon items, monthly staples, learned preferences, and cautious household memory controls."
        />
        <HouseholdSwitcher households={households} currentHouseholdId={householdId} />
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
          emptyTitle="Nothing due soon"
          emptyDescription="HomeStock will surface items here when repeated grocery history indicates they may be running low."
        />
      </CategorySection>

      <CategorySection title="Monthly Staples" count={memory.monthlyStaples.length}>
        <MemorySuggestionList
          householdId={householdId}
          actorId={actorId}
          suggestions={memory.monthlyStaples}
          emptyTitle="No monthly staples yet"
          emptyDescription="Items like atta, oil, rice, or spices will appear here after enough monthly activity is visible."
        />
      </CategorySection>

      <CategorySection title="Frequent Items" count={memory.frequentItems.length}>
        <MemorySuggestionList
          householdId={householdId}
          actorId={actorId}
          suggestions={memory.frequentItems}
          emptyTitle="No frequent items yet"
          emptyDescription="Repeated grocery requests and cart activity will become frequent item suggestions."
        />
      </CategorySection>

      <CategorySection title="Learned Preferences" count={memory.learnedPreferences.length}>
        <MemorySuggestionList
          householdId={householdId}
          actorId={actorId}
          suggestions={memory.learnedPreferences}
          emptyTitle="No learned preferences yet"
          emptyDescription="Preferred brands and usual quantities will appear when the household repeats cart choices."
        />
      </CategorySection>

      <section className="rounded-[1.5rem] border border-forest/15 bg-sage p-5 text-forest shadow-editorial">
        <p className="text-xs font-bold uppercase tracking-[0.24em]">Memory controls</p>
        <h2 className="font-editorial mt-2 text-3xl font-semibold">Cautious memory, admin controlled</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <MemoryControl title="Suggest reorders" detail="Enabled for simple recurring grocery patterns." />
          <MemoryControl title="Dismiss suggestions" detail="Session-only for v1. Persistent dismissal needs a later schema change." />
          <MemoryControl title="Auto-checkout" detail="Disabled. Orders always need explicit admin approval." />
        </div>
      </section>
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
