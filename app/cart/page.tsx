import { CartDraftView } from "@/components/CartDraftView";
import { HouseholdSwitcher } from "@/components/HouseholdSwitcher";
import { PrepareCartButton } from "@/components/PrepareCartButton";
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

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Cart drafts</h1>
          <p className="mt-1 text-sm text-slate-600">Mock provider estimates are clearly separated from future Swiggy Instamart data.</p>
        </div>
        <HouseholdSwitcher households={households} currentHouseholdId={householdId} />
      </div>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <p className="text-sm text-slate-700">{approvedRequestCount} approved grocery requests can be converted into a mock cart.</p>
        <PrepareCartButton householdId={householdId} actorId={actorId} disabled={approvedRequestCount === 0} />
      </section>

      <div className="grid gap-4">
        {carts.length ? (
          carts.map((cart) => <CartDraftView key={cart.id} cart={cart} actorId={actorId} />)
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">No cart drafts yet.</div>
        )}
      </div>
    </div>
  );
}
