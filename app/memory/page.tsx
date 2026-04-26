import { CategorySection } from "@/components/CategorySection";
import { EmptyState } from "@/components/EmptyState";
import { MemorySuggestionCard } from "@/components/MemorySuggestionCard";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { SummaryCard } from "@/components/SummaryCard";
import { prisma } from "@/lib/prisma";
import { getDefaultHouseholdId } from "@/lib/services/household-service";

export const dynamic = "force-dynamic";

export default async function MemoryPage() {
  const householdId = await getDefaultHouseholdId();
  const [recurringPatterns, staples, preferences] = await Promise.all([
    prisma.recurringPattern.findMany({
      where: { householdId },
      include: { groceryItem: true },
      orderBy: [{ confidenceScore: "desc" }, { updatedAt: "desc" }]
    }),
    prisma.groceryItem.findMany({
      where: { category: "Staples" },
      orderBy: { displayName: "asc" },
      take: 8
    }),
    prisma.groceryPreference.findMany({
      where: { householdId },
      include: { groceryItem: true },
      orderBy: { updatedAt: "desc" },
      take: 6
    })
  ]);

  const dueSoon = recurringPatterns.filter((pattern) => {
    if (!pattern.lastOrderedAt) return false;
    const daysSince = Math.floor((Date.now() - pattern.lastOrderedAt.getTime()) / (24 * 60 * 60 * 1000));
    return daysSince >= Math.max(1, pattern.averageIntervalDays - 1);
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Memory"
        title="Household Grocery Brain"
        meta={`${recurringPatterns.length} patterns`}
        description="Review recurring suggestions, due-soon items, monthly staples, learned preferences, and controls for household memory."
      />

      <section className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Recurring" value={recurringPatterns.length} detail="Learned patterns" tone="lavender" />
        <SummaryCard label="Due soon" value={dueSoon.length} detail="Needs review" tone="peach" />
        <SummaryCard label="Monthly staples" value={staples.length} detail="Seed catalog" tone="sage" />
        <SummaryCard label="Preferences" value={preferences.length} detail="Brand memory" tone="paper" />
      </section>

      <CategorySection title="Recurring suggestions" count={recurringPatterns.length}>
        <div className="grid gap-3 md:grid-cols-2">
          {recurringPatterns.length ? (
            recurringPatterns.map((pattern) => (
              <MemorySuggestionCard
                key={pattern.id}
                title={pattern.groceryItem.displayName}
                detail={`Usually every ${pattern.averageIntervalDays} days${pattern.usualQuantity ? ` · ${pattern.usualQuantity} ${pattern.usualUnit ?? ""}` : ""}. Confidence ${Math.round(pattern.confidenceScore * 100)}%.`}
              />
            ))
          ) : (
            <EmptyState title="No recurring patterns yet" description="Patterns will appear after repeated approvals or orders are recorded." />
          )}
        </div>
      </CategorySection>

      <CategorySection title="Due soon" count={dueSoon.length}>
        <div className="grid gap-3 md:grid-cols-2">
          {dueSoon.length ? (
            dueSoon.map((pattern) => (
              <article key={pattern.id} className="rounded-lg border border-cocoa/10 bg-peach/45 p-4 shadow-panel">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-editorial text-2xl font-semibold text-cocoa">{pattern.groceryItem.displayName}</h3>
                    <p className="mt-2 text-sm text-bark">Due based on household usage history.</p>
                  </div>
                  <StatusPill tone="urgent">Due</StatusPill>
                </div>
              </article>
            ))
          ) : (
            <EmptyState title="Nothing due soon" description="HomeStock will surface items here when usage patterns indicate they may be running low." />
          )}
        </div>
      </CategorySection>

      <CategorySection title="Monthly staples" count={staples.length}>
        <div className="grid gap-3 md:grid-cols-2">
          {staples.map((item) => (
            <article key={item.id} className="rounded-lg border border-cocoa/10 bg-paper p-4 shadow-panel">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-bark">{item.category}</p>
              <h3 className="mt-2 text-xl font-semibold text-cocoa">{item.displayName}</h3>
              <p className="mt-1 text-sm text-bark">Default unit: {item.defaultUnit ?? "not set"}</p>
            </article>
          ))}
        </div>
      </CategorySection>

      <CategorySection title="Learned preferences" count={preferences.length}>
        {preferences.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {preferences.map((preference) => (
              <article key={preference.id} className="rounded-lg border border-cocoa/10 bg-paper p-4 shadow-panel">
                <h3 className="text-xl font-semibold text-cocoa">{preference.groceryItem.displayName}</h3>
                <p className="mt-2 text-sm text-bark">Preferred brand: {preference.preferredBrand ?? "not learned yet"}</p>
                <p className="mt-1 text-sm text-bark">Usual quantity: {preference.preferredQuantity ?? "not set"} {preference.preferredUnit ?? ""}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No learned preferences yet" description="Brand, quantity, and substitution preferences will appear as the household uses HomeStock." />
        )}
      </CategorySection>

      <section className="rounded-[1.5rem] border border-forest/15 bg-sage p-5 text-forest shadow-editorial">
        <p className="text-xs font-bold uppercase tracking-[0.24em]">Memory controls</p>
        <h2 className="font-editorial mt-2 text-3xl font-semibold">Cautious memory, admin controlled</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <MemoryControl title="Suggest reorders" detail="Enabled for recurring grocery patterns." />
          <MemoryControl title="Auto-checkout" detail="Disabled. Orders always need explicit admin approval." />
          <MemoryControl title="External providers" detail="Mock provider only until integrations are configured." />
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
