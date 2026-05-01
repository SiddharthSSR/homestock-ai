import { AddGroceryRequestForm } from "@/components/AddGroceryRequestForm";
import { CookHelperRequestForm } from "@/components/CookHelperRequestForm";
import { CurrentActorSwitcher } from "@/components/CurrentActorSwitcher";
import { HouseholdSwitcher } from "@/components/HouseholdSwitcher";
import { PageHeader } from "@/components/PageHeader";
import { getAddRequestExperience } from "@/lib/cook-helper-mode";
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
  const addExperience = getAddRequestExperience(actorRole);
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
  const submittedRequests =
    addExperience === "cook-helper"
      ? await prisma.groceryRequest.findMany({
          where: { householdId, requestedBy: actorId },
          select: {
            id: true,
            displayName: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: "desc" },
          take: 6
        })
      : [];

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <PageHeader
          eyebrow="Add request"
          title={addExperience === "cook-helper" ? "Cook Helper" : "Tell the household what is needed"}
          meta="Cook friendly"
          description={
            addExperience === "cook-helper"
              ? "Add groceries quickly in simple language. HomeStock organizes the request and sends it for household approval."
              : "Write a simple grocery note. HomeStock parses it, highlights likely duplicates, and adds requests to the approval list."
          }
        />
        <div className="grid gap-3">
          <HouseholdSwitcher households={households} currentHouseholdId={householdId} />
          <CurrentActorSwitcher members={members} currentActorId={actorId} />
        </div>
      </div>

      {addExperience === "cook-helper" ? (
        <CookHelperRequestForm
          householdId={householdId}
          actorId={actorId}
          existingRequests={existingRequests}
          submittedRequests={submittedRequests.map((request) => ({
            id: request.id,
            displayName: request.displayName,
            status: request.status,
            createdAtLabel: formatSubmittedAt(request.createdAt)
          }))}
        />
      ) : (
        <AddGroceryRequestForm householdId={householdId} actorId={actorId} actorRole={actorRole ?? "MEMBER"} cookActorId={cookMember?.userId} existingRequests={existingRequests} />
      )}
    </div>
  );
}

function formatSubmittedAt(value: Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(value);
}
