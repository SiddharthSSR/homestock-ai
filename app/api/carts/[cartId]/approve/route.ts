import { NextResponse } from "next/server";
import { apiErrorResponse, assertSameOriginRequest, cartDraftHouseholdId, clientActorFromBody, requireApiActor } from "@/lib/auth/api-auth";
import { approveCart } from "@/lib/services/cart-service";

export async function POST(request: Request, { params }: { params: Promise<{ cartId: string }> }) {
  try {
    assertSameOriginRequest(request);
    const { cartId } = await params;
    const body = await request.json().catch(() => ({}));
    const householdId = await cartDraftHouseholdId(cartId);
    const actor = await requireApiActor(householdId, clientActorFromBody(body));
    const cart = await approveCart(cartId, actor.actorId);
    return NextResponse.json({ cart });
  } catch (error) {
    return apiErrorResponse(error, "Could not approve cart draft.");
  }
}
