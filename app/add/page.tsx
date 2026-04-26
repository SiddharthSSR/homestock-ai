import { AddGroceryRequestForm } from "@/components/AddGroceryRequestForm";
import { HouseholdSwitcher } from "@/components/HouseholdSwitcher";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { getDefaultActorId, getDefaultHouseholdId } from "@/lib/services/household-service";

export const dynamic = "force-dynamic";

export default async function AddRequestPage({ searchParams }: { searchParams: Promise<{ householdId?: string }> }) {
  const params = await searchParams;
  const actorId = await getDefaultActorId();
  const households = await prisma.household.findMany({ orderBy: { createdAt: "asc" } });
  const householdId = params.householdId ?? households[0]?.id ?? (await getDefaultHouseholdId());
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
      status: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          eyebrow="Add request"
          title="Tell the household what is needed"
          meta="Cook friendly"
          description="Write a simple grocery note. HomeStock parses it, highlights likely duplicates, and adds requests to the approval list."
        />
        <HouseholdSwitcher households={households} currentHouseholdId={householdId} />
      </div>

      <AddGroceryRequestForm householdId={householdId} actorId={actorId} cookActorId={cookMember?.userId} existingRequests={existingRequests} />
    </div>
  );
}
