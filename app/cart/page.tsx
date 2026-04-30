import { CartDraftView } from "@/components/CartDraftView";
import { EmptyState } from "@/components/EmptyState";
import { HouseholdSwitcher } from "@/components/HouseholdSwitcher";
import { PageHeader } from "@/components/PageHeader";
import { PrepareCartButton } from "@/components/PrepareCartButton";
import { SummaryCard } from "@/components/SummaryCard";
import { prisma } from "@/lib/prisma";
import { getDefaultActorId, getDefaultHouseholdId } from "@/lib/services/household-service";

export const dynamic = "force-dynamic";

export default async function CartPage({ searchParams }: { searchParams: Promise<{ householdId?: string }> }) {
  const params = await searchParams;
  const actorId = await getDefaultActorId();
  const households = await prisma.household.findMany({ orderBy: { createdAt: "asc" } });
  const householdId = params.householdId ?? households[0]?.id ?? (await getDefaultHouseholdId());
  const carts = await prisma.cartDraft.findMany({
    where: { householdId },
    include: { items: true },
    orderBy: { createdAt: "desc" }
  });
  const approvedRequestCount = await prisma.groceryRequest.count({
    where: { householdId, status: "APPROVED" }
  });
  const latestCart = carts[0];
  const unavailableCount = latestCart?.items.filter((item) => item.availabilityStatus === "UNAVAILABLE").length ?? 0;
  const substitutedCount = latestCart?.items.filter((item) => item.availabilityStatus === "SUBSTITUTED").length ?? 0;

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <PageHeader
          eyebrow="Cart draft"
          title="Mock Cart Review"
          meta="No checkout"
          description="Prepare and approve a household cart draft. Swiggy is not connected, so all prices and availability are mock provider estimates."
        />
        <HouseholdSwitcher households={households} currentHouseholdId={householdId} />
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="Approved requests" value={approvedRequestCount} detail="Can become cart items" tone="lavender" />
        <SummaryCard label="Estimated total" value={latestCart ? `₹${latestCart.estimatedTotal.toFixed(0)}` : "₹0"} detail="Mock provider estimate" tone="peach" />
        <SummaryCard label="Review flags" value={unavailableCount + substitutedCount} detail={`${substitutedCount} substituted, ${unavailableCount} unavailable`} tone="sage" />
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cocoa/10 bg-paper p-5 shadow-panel">
        <div>
          <p className="font-semibold text-cocoa">Provider status: mock mode</p>
          <p className="mt-1 text-sm text-bark">
            {approvedRequestCount
              ? `${approvedRequestCount} approved grocery requests can be converted into a mock cart draft.`
              : "Approve grocery requests before preparing the next mock cart draft."}
          </p>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-bark">No checkout, payment, or Swiggy order is available in this flow.</p>
        </div>
        <PrepareCartButton householdId={householdId} actorId={actorId} disabled={approvedRequestCount === 0} />
      </section>

      <div className="grid gap-4">
        {latestCart ? (
          <>
            {carts.length > 1 ? <p className="text-sm text-bark">Showing latest cart draft. {carts.length - 1} older draft{carts.length > 2 ? "s are" : " is"} hidden from this review.</p> : null}
            <CartDraftView cart={latestCart} actorId={actorId} />
          </>
        ) : (
          <EmptyState title="No cart drafts yet" description="Approve grocery requests first, then prepare a mock cart for admin review." />
        )}
      </div>
    </div>
  );
}
