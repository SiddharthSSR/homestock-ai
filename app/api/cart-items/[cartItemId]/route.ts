import { NextResponse } from "next/server";
import { apiErrorResponse, assertSameOriginRequest, cartItemHouseholdId, clientActorFromBody, requireApiActor } from "@/lib/auth/api-auth";
import { removeCartItem, updateCartItemQuantity } from "@/lib/services/cart-service";

export async function PATCH(request: Request, { params }: { params: Promise<{ cartItemId: string }> }) {
  try {
    assertSameOriginRequest(request);
    const { cartItemId } = await params;
    const body = await request.json().catch(() => ({}));
    const householdId = await cartItemHouseholdId(cartItemId);
    const actor = await requireApiActor(householdId, clientActorFromBody(body));
    const quantity = body.quantity === null || body.quantity === "" || body.quantity === undefined ? null : Number(body.quantity);

    if (quantity !== null && (!Number.isFinite(quantity) || quantity < 0)) {
      return NextResponse.json({ error: "Quantity must be a positive number." }, { status: 400 });
    }

    const item = await updateCartItemQuantity(cartItemId, actor.actorId, quantity);
    return NextResponse.json({ item });
  } catch (error) {
    return apiErrorResponse(error, "Could not update cart item.");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ cartItemId: string }> }) {
  try {
    assertSameOriginRequest(request);
    const { cartItemId } = await params;
    const body = await request.json().catch(() => ({}));
    const householdId = await cartItemHouseholdId(cartItemId);
    const actor = await requireApiActor(householdId, clientActorFromBody(body));
    const cart = await removeCartItem(cartItemId, actor.actorId);
    return NextResponse.json({ cart });
  } catch (error) {
    return apiErrorResponse(error, "Could not remove cart item.");
  }
}
