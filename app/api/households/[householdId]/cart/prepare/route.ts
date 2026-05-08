import { NextResponse } from "next/server";
import { apiErrorResponse, assertSameOriginRequest, clientActorFromBody, requireApiActor } from "@/lib/auth/api-auth";
import { prepareMockCart } from "@/lib/services/cart-service";

export async function POST(request: Request, { params }: { params: Promise<{ householdId: string }> }) {
  try {
    assertSameOriginRequest(request);
    const { householdId } = await params;
    const body = await request.json().catch(() => ({}));
    const actor = await requireApiActor(householdId, clientActorFromBody(body));
    const cart = await prepareMockCart(householdId, actor.actorId);
    return NextResponse.json({ cart }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Could not prepare mock cart.");
  }
}
