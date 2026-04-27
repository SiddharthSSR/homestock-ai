import Link from "next/link";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { ApprovalActions } from "@/components/ApprovalActions";
import { BulkApprovalActions } from "@/components/BulkApprovalActions";
import { EmptyState } from "@/components/EmptyState";
import { HouseholdSwitcher } from "@/components/HouseholdSwitcher";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { SummaryCard } from "@/components/SummaryCard";
import { prisma } from "@/lib/prisma";
import { getDefaultActorId, getDefaultHouseholdId } from "@/lib/services/household-service";

export const dynamic = "force-dynamic";

export default async function ApprovePage({ searchParams }: { searchParams: Promise<{ householdId?: string }> }) {
  const params = await searchParams;
  const actorId = await getDefaultActorId();
  const households = await prisma.household.findMany({ orderBy: { createdAt: "asc" } });
  const householdId = params.householdId ?? households[0]?.id ?? (await getDefaultHouseholdId());
  const pendingRequests = await prisma.groceryRequest.findMany({
    where: { householdId, status: "PENDING" },
    include: { requester: { select: { name: true } } },
    orderBy: [{ urgency: "desc" }, { createdAt: "desc" }]
  });
  const urgentCount = pendingRequests.filter((request) => request.urgency === "HIGH").length;

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <PageHeader
          eyebrow="Admin approval"
          title="Approval Queue"
          meta={`${pendingRequests.length} pending`}
          description="Review pending grocery requests before anything moves toward a cart. No order will be placed from this page."
        />
        <HouseholdSwitcher households={households} currentHouseholdId={householdId} />
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
          <BulkApprovalActions requestIds={pendingRequests.map((request) => request.id)} actorId={actorId} />
        </div>
      </section>

      <section className="rounded-lg border border-peachDeep/30 bg-peach/45 p-5 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="cart">Duplicate merge</StatusPill>
              <p className="font-semibold text-cocoa">Dahi and curd look similar. Merge?</p>
            </div>
            <p className="mt-2 text-sm text-bark">This UI reserves a safe place for merge review. Phase 1 still uses the existing duplicate merge service when compatible.</p>
          </div>
          <Link className="rounded-md border border-cocoa/20 bg-paper px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cocoa hover:bg-cream" href="/grocery">
            Review list
          </Link>
        </div>
      </section>

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
                <ApprovalActions requestId={request.id} actorId={actorId} />
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
