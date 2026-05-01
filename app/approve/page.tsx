import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { ApprovalActions } from "@/components/ApprovalActions";
import { BulkApprovalActions } from "@/components/BulkApprovalActions";
import { EmptyState } from "@/components/EmptyState";
import { CurrentActorSwitcher } from "@/components/CurrentActorSwitcher";
import { HouseholdSwitcher } from "@/components/HouseholdSwitcher";
import { PageHeader } from "@/components/PageHeader";
import { PreservedQueryLink } from "@/components/PreservedQueryLink";
import { StatusPill } from "@/components/StatusPill";
import { SummaryCard } from "@/components/SummaryCard";
import { findDuplicateHints } from "@/lib/grocery/duplicate-hints";
import { prisma } from "@/lib/prisma";
import { getDefaultHouseholdId, resolveCurrentActorId } from "@/lib/services/household-service";
import { getHouseholdRole, roleCapabilities } from "@/lib/services/permissions-service";

export const dynamic = "force-dynamic";

export default async function ApprovePage({ searchParams }: { searchParams: Promise<{ householdId?: string; actorId?: string }> }) {
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
  const pendingRequests = await prisma.groceryRequest.findMany({
    where: { householdId, status: "PENDING" },
    include: { requester: { select: { name: true } } },
    orderBy: [{ urgency: "desc" }, { createdAt: "desc" }]
  });
  const urgentCount = pendingRequests.filter((request) => request.urgency === "HIGH").length;
  const duplicateHints = findDuplicateHints(pendingRequests);

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <PageHeader
          eyebrow="Admin approval"
          title="Approval Queue"
          meta={`${pendingRequests.length} pending`}
          description="Review pending grocery requests before anything moves toward a cart. No order will be placed from this page."
        />
        <div className="grid gap-3">
          <HouseholdSwitcher households={households} currentHouseholdId={householdId} />
          <CurrentActorSwitcher members={members} currentActorId={actorId} />
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="Pending" value={pendingRequests.length} detail="Waiting for admin" tone="peach" icon={AlertTriangle} />
        <SummaryCard label="Urgent" value={urgentCount} detail="Prioritize today" tone="lavender" icon={ShieldCheck} />
        <SummaryCard label="Orders placed" value="0" detail="This page cannot checkout" tone="sage" icon={CheckCircle2} />
      </section>

      <section className="rounded-lg border border-forest/15 bg-sage p-5 text-forest shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em]">Trust rule</p>
            <p className="font-editorial mt-2 text-3xl font-semibold">No order will be placed from this page.</p>
          </div>
          {permissions.canApproveGrocery ? (
            <BulkApprovalActions requestIds={pendingRequests.map((request) => request.id)} actorId={actorId} />
          ) : (
            <p className="max-w-sm text-sm font-semibold text-forest/80">Only household admins can approve grocery requests.</p>
          )}
        </div>
      </section>

      {duplicateHints.length ? (
        <section className="rounded-lg border border-peachDeep/30 bg-peach/45 p-5 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone="cart">Duplicate merge</StatusPill>
                <p className="font-semibold text-cocoa">{formatDuplicateNames(duplicateHints[0].names)} look similar. Merge?</p>
              </div>
              <p className="mt-2 text-sm text-bark">Review these synonym matches before merging household requests.</p>
            </div>
            <PreservedQueryLink className="rounded-md border border-cocoa/20 bg-paper px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cocoa hover:bg-cream" href="/grocery">
              Review list
            </PreservedQueryLink>
          </div>
        </section>
      ) : null}

      <section className="grid gap-3">
        {pendingRequests.length ? (
          pendingRequests.map((request) => (
            <article key={request.id} className="rounded-lg border border-cocoa/10 bg-paper p-4 shadow-panel">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-bark">{request.category}</p>
                  <h2 className="mt-2 text-xl font-semibold text-cocoa">{request.displayName}</h2>
                  <p className="mt-1 text-sm text-bark">
                    {request.quantity ?? "Qty not set"}
                    {request.unit ? ` ${request.unit}` : ""} · requested by {request.requester.name}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone={request.urgency === "HIGH" ? "urgent" : "neutral"}>{request.urgency}</StatusPill>
                  <StatusPill tone="pending">{request.status}</StatusPill>
                </div>
              </div>
              {request.notes ? <p className="mt-4 rounded-md bg-cream px-3 py-2 text-sm text-bark">{request.notes}</p> : null}
              <div className="mt-4">
                {permissions.canApproveGrocery ? <ApprovalActions requestId={request.id} actorId={actorId} showSecondaryActions={false} /> : <p className="text-sm font-semibold text-bark">Only household admins can approve or reject this request.</p>}
              </div>
            </article>
          ))
        ) : (
          <EmptyState title="Nothing needs approval" description="Pending grocery requests will appear here before they can become cart-ready." />
        )}
      </section>
    </div>
  );
}

function formatDuplicateNames(names: string[]) {
  const [first, second] = names;
  return [first, second].filter(Boolean).join(" and ");
}
