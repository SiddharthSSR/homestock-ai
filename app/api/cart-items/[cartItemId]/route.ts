import { NextResponse } from "next/server";
import { removeCartItem, updateCartItemQuantity } from "@/lib/services/cart-service";
import { getDefaultActorId } from "@/lib/services/household-service";

export async function PATCH(request: Request, { params }: { params: Promise<{ cartItemId: string }> }) {
  try {
    const { cartItemId } = await params;
    const body = await request.json().catch(() => ({}));
    const actorId = String(body.actorId || (await getDefaultActorId()));
    const quantity = body.quantity === null || body.quantity === "" || body.quantity === undefined ? null : Number(body.quantity);

    if (quantity !== null && (!Number.isFinite(quantity) || quantity < 0)) {
      return NextResponse.json({ error: "Quantity must be a positive number." }, { status: 400 });
    }

    const item = await updateCartItemQuantity(cartItemId, actorId, quantity);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update cart item." }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ cartItemId: string }> }) {
  try {
    const { cartItemId } = await params;
    const body = await request.json().catch(() => ({}));
    const actorId = String(body.actorId || (await getDefaultActorId()));
    const cart = await removeCartItem(cartItemId, actorId);
    return NextResponse.json({ cart });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not remove cart item." }, { status: 400 });
  }
}
