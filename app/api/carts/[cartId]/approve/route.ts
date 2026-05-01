import { NextResponse } from "next/server";
import { approveCart } from "@/lib/services/cart-service";
import { getDefaultActorId } from "@/lib/services/household-service";
import { PermissionError } from "@/lib/services/permissions-service";

export async function POST(request: Request, { params }: { params: Promise<{ cartId: string }> }) {
  try {
    const { cartId } = await params;
    const body = await request.json().catch(() => ({}));
    const actorId = String(body.actorId || (await getDefaultActorId()));
    const cart = await approveCart(cartId, actorId);
    return NextResponse.json({ cart });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not approve cart draft." }, { status: error instanceof PermissionError ? 403 : 400 });
  }
}
