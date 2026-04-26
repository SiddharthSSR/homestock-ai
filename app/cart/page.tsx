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

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
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
        <SummaryCard label="Unavailable" value={unavailableCount} detail="Needs admin review" tone="sage" />
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cocoa/10 bg-paper p-5 shadow-panel">
        <div>
          <p className="font-semibold text-cocoa">Provider status: mock mode</p>
          <p className="mt-1 text-sm text-bark">{approvedRequestCount} approved grocery requests can be converted into a mock cart draft.</p>
        </div>
        <PrepareCartButton householdId={householdId} actorId={actorId} disabled={approvedRequestCount === 0} />
      </section>

      <div className="grid gap-4">
        {carts.length ? (
          carts.map((cart) => <CartDraftView key={cart.id} cart={cart} actorId={actorId} />)
        ) : (
          <EmptyState title="No cart drafts yet" description="Approve grocery requests first, then prepare a mock cart for admin review." />
        )}
      </div>
    </div>
  );
}
