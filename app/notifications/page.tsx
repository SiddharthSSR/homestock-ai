import { BellRing, CheckCircle2, Clock3 } from "lucide-react";
import { CategorySection } from "@/components/CategorySection";
import { CurrentActorSwitcher } from "@/components/CurrentActorSwitcher";
import { HouseholdSwitcher } from "@/components/HouseholdSwitcher";
import { PageHeader } from "@/components/PageHeader";
import { ReminderList } from "@/components/ReminderList";
import { SummaryCard } from "@/components/SummaryCard";
import { prisma } from "@/lib/prisma";
import { getDefaultHouseholdId, resolveCurrentActorId } from "@/lib/services/household-service";
import { getHouseholdReminders, groupedReminders } from "@/lib/services/reminder-service";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ householdId?: string; actorId?: string }> }) {
  const params = await searchParams;
  const households = await prisma.household.findMany({ orderBy: { createdAt: "asc" } });
  const householdId = params.householdId ?? households[0]?.id ?? (await getDefaultHouseholdId());
  const actorId = await resolveCurrentActorId(householdId, params.actorId);
  const [members, reminders] = await Promise.all([
    prisma.householdMember.findMany({
      where: { householdId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" }
    }),
    getHouseholdReminders({ householdId, actorId })
  ]);
  const grouped = groupedReminders(reminders);

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <PageHeader
          eyebrow="Notifications"
          title="Household Reminders"
          meta={`${reminders.length} active`}
          description="Generated in-app reminders for approvals, cart review, running-low memory, and request status updates. No external messages are sent."
        />
        <div className="grid gap-3">
          <HouseholdSwitcher households={households} currentHouseholdId={householdId} />
          <CurrentActorSwitcher members={members} currentActorId={actorId} />
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="Needs action" value={grouped.needsAction.length} detail="Approval or cart review" tone="peach" icon={BellRing} />
        <SummaryCard label="Running low" value={grouped.runningLow.length} detail="Based on household memory" tone="sage" icon={Clock3} />
        <SummaryCard label="Status updates" value={grouped.statusUpdates.length} detail="Submitted request progress" tone="lavender" icon={CheckCircle2} />
      </section>

      <CategorySection title="Needs Action" count={grouped.needsAction.length}>
        <ReminderList reminders={grouped.needsAction} emptyTitle="No admin actions due" emptyDescription="Pending approvals and ready cart drafts will appear here for household admins." />
      </CategorySection>

      <CategorySection title="Running Low" count={grouped.runningLow.length}>
        <ReminderList reminders={grouped.runningLow} emptyTitle="No running-low reminders" emptyDescription="Memory reminders appear here when recurring household items may need attention." />
      </CategorySection>

      <CategorySection title="Status Updates" count={grouped.statusUpdates.length}>
        <ReminderList reminders={grouped.statusUpdates} emptyTitle="No request status updates" emptyDescription="Cook/helper request status summaries appear here when relevant." />
      </CategorySection>
    </div>
  );
}
