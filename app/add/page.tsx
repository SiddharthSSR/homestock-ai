import { AddGroceryRequestForm } from "@/components/AddGroceryRequestForm";
import { CurrentActorSwitcher } from "@/components/CurrentActorSwitcher";
import { HouseholdSwitcher } from "@/components/HouseholdSwitcher";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { getDefaultHouseholdId, resolveCurrentActorId } from "@/lib/services/household-service";
import { getHouseholdRole } from "@/lib/services/permissions-service";

export const dynamic = "force-dynamic";

export default async function AddRequestPage({ searchParams }: { searchParams: Promise<{ householdId?: string; actorId?: string }> }) {
  const params = await searchParams;
  const households = await prisma.household.findMany({ orderBy: { createdAt: "asc" } });
  const householdId = params.householdId ?? households[0]?.id ?? (await getDefaultHouseholdId());
  const actorId = await resolveCurrentActorId(householdId, params.actorId);
  const [members, actorRole] = await Promise.all([
    prisma.householdMember.findMany({
      where: { householdId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" }
    }),
    getHouseholdRole(householdId, actorId)
  ]);
  const cookMember = await prisma.householdMember.findFirst({
    where: { householdId, role: "COOK" },
    select: { userId: true }
  });
  const existingRequests = await prisma.groceryRequest.findMany({
    where: {
      householdId,
      status: { in: ["PENDING", "APPROVED"] }
    },
    select: {
      id: true,
      canonicalName: true,
      displayName: true,
      unit: true,
      status: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <PageHeader
          eyebrow="Add request"
          title="Tell the household what is needed"
          meta="Cook friendly"
          description="Write a simple grocery note. HomeStock parses it, highlights likely duplicates, and adds requests to the approval list."
        />
        <div className="grid gap-3">
          <HouseholdSwitcher households={households} currentHouseholdId={householdId} />
          <CurrentActorSwitcher members={members} currentActorId={actorId} />
        </div>
      </div>

      <AddGroceryRequestForm householdId={householdId} actorId={actorId} actorRole={actorRole ?? "MEMBER"} cookActorId={cookMember?.userId} existingRequests={existingRequests} />
    </div>
  );
}
