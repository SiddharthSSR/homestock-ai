import { NextResponse } from "next/server";
import { approveCart } from "@/lib/services/cart-service";
import { getDefaultActorId } from "@/lib/services/household-service";

export async function POST(request: Request, { params }: { params: Promise<{ cartId: string }> }) {
  const { cartId } = await params;
  const body = await request.json().catch(() => ({}));
  const actorId = String(body.actorId || (await getDefaultActorId()));
  const cart = await approveCart(cartId, actorId);
  return NextResponse.json({ cart });
}
