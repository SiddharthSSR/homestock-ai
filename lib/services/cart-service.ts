import { CartDraftStatus, GroceryProvider, GroceryRequestStatus } from "@prisma/client";
import { getGroceryProvider } from "@/lib/providers";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "./audit-service";

export async function prepareMockCart(householdId: string, actorId: string) {
  const household = await prisma.household.findUniqueOrThrow({ where: { id: householdId } });
  const approvedRequests = await prisma.groceryRequest.findMany({
    where: {
      householdId,
      status: GroceryRequestStatus.APPROVED
    },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }]
  });

  const provider = getGroceryProvider("MOCK");
  const providerDraft = await provider.prepareCart(
    approvedRequests.map((request) => ({
      requestId: request.id,
      canonicalName: request.canonicalName,
      displayName: request.displayName,
      quantity: request.quantity,
      unit: request.unit,
      category: request.category
    })),
    { householdId, location: household.location }
  );

  const cart = await prisma.cartDraft.create({
    data: {
      householdId,
      provider: GroceryProvider.MOCK,
      status: CartDraftStatus.READY_FOR_APPROVAL,
      estimatedTotal: providerDraft.estimatedTotal,
      createdBy: actorId,
      items: {
        create: providerDraft.items.map((item) => ({
          groceryRequestId: item.groceryRequestId,
          productId: item.productId,
          productName: item.productName,
          brand: item.brand,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          availabilityStatus: item.availabilityStatus,
          substitutionReason: item.substitutionReason
        }))
      }
    },
    include: { items: true }
  });

  await prisma.groceryRequest.updateMany({
    where: { id: { in: approvedRequests.map((request) => request.id) } },
    data: { status: GroceryRequestStatus.ADDED_TO_CART }
  });

  await writeAuditLog({
    householdId,
    actorId,
    action: "CART_DRAFT_PREPARED",
    entityType: "CartDraft",
    entityId: cart.id,
    after: cart
  });

  return cart;
}

export async function approveCart(cartId: string, actorId: string) {
  const existing = await prisma.cartDraft.findUniqueOrThrow({
    where: { id: cartId },
    include: { items: true }
  });

  const updated = await prisma.cartDraft.update({
    where: { id: cartId },
    data: {
      status: CartDraftStatus.APPROVED,
      approvedBy: actorId,
      approvedAt: new Date()
    },
    include: { items: true }
  });

  await writeAuditLog({
    householdId: existing.householdId,
    actorId,
    action: "CART_DRAFT_APPROVED",
    entityType: "CartDraft",
    entityId: cartId,
    before: existing,
    after: updated
  });

  return updated;
}
