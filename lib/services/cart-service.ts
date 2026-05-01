import { CartDraftStatus, GroceryProvider, GroceryRequestStatus } from "@prisma/client";
import type { CartItem } from "@prisma/client";
import { calculateMockLineTotal } from "@/lib/providers/mock-grocery-provider";
import { getGroceryProvider } from "@/lib/providers";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "./audit-service";
import { assertHouseholdPermission } from "./permissions-service";

function calculateCartTotal(items: Pick<CartItem, "price" | "quantity">[]) {
  return items.reduce((total, item) => total + calculateMockLineTotal(item.price, item.quantity), 0);
}

export async function prepareMockCart(householdId: string, actorId: string) {
  await assertHouseholdPermission(householdId, actorId, "cart:prepare");

  const household = await prisma.household.findUniqueOrThrow({ where: { id: householdId } });
  const approvedRequests = await prisma.groceryRequest.findMany({
    where: {
      householdId,
      status: GroceryRequestStatus.APPROVED
    },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }]
  });

  if (!approvedRequests.length) {
    throw new Error("No approved grocery requests are available for cart preparation.");
  }

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
  await assertHouseholdPermission(existing.householdId, actorId, "cart:approve");

  if (existing.status !== CartDraftStatus.READY_FOR_APPROVAL) {
    throw new Error("Only cart drafts that are ready for approval can be approved.");
  }

  if (!existing.items.length) {
    throw new Error("Cannot approve an empty cart draft.");
  }

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

export async function updateCartItemQuantity(cartItemId: string, actorId: string, quantity: number | null) {
  const existing = await prisma.cartItem.findUniqueOrThrow({
    where: { id: cartItemId },
    include: { cartDraft: true }
  });
  await assertHouseholdPermission(existing.cartDraft.householdId, actorId, "cart:edit");

  if (existing.cartDraft.status !== CartDraftStatus.READY_FOR_APPROVAL) {
    throw new Error("Only ready cart drafts can be edited.");
  }

  const updatedCart = await prisma.$transaction(async (tx) => {
    const updatedItem = await tx.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: { cartDraft: true }
    });

    const cartItems = await tx.cartItem.findMany({
      where: { cartDraftId: existing.cartDraftId }
    });

    const cartDraft = await tx.cartDraft.update({
      where: { id: existing.cartDraftId },
      data: { estimatedTotal: calculateCartTotal(cartItems) },
      include: { items: true }
    });

    return { updatedItem, cartDraft };
  });

  await writeAuditLog({
    householdId: existing.cartDraft.householdId,
    actorId,
    action: "CART_ITEM_QUANTITY_UPDATED",
    entityType: "CartItem",
    entityId: cartItemId,
    before: existing,
    after: updatedCart.updatedItem
  });

  return updatedCart.cartDraft;
}

export async function removeCartItem(cartItemId: string, actorId: string) {
  const existing = await prisma.cartItem.findUniqueOrThrow({
    where: { id: cartItemId },
    include: { cartDraft: { include: { items: true } } }
  });
  await assertHouseholdPermission(existing.cartDraft.householdId, actorId, "cart:edit");

  if (existing.cartDraft.status !== CartDraftStatus.READY_FOR_APPROVAL) {
    throw new Error("Only ready cart drafts can be edited.");
  }

  const updatedCart = await prisma.$transaction(async (tx) => {
    await tx.cartItem.delete({ where: { id: cartItemId } });
    await tx.groceryRequest.update({
      where: { id: existing.groceryRequestId },
      data: { status: GroceryRequestStatus.APPROVED }
    });

    const remainingItems = await tx.cartItem.findMany({
      where: { cartDraftId: existing.cartDraftId }
    });

    return tx.cartDraft.update({
      where: { id: existing.cartDraftId },
      data: {
        estimatedTotal: calculateCartTotal(remainingItems)
      },
      include: { items: true }
    });
  });

  await writeAuditLog({
    householdId: existing.cartDraft.householdId,
    actorId,
    action: "CART_ITEM_REMOVED",
    entityType: "CartItem",
    entityId: cartItemId,
    before: existing,
    after: updatedCart
  });

  return updatedCart;
}
