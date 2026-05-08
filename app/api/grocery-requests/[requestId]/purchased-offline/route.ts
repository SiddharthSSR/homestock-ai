import { GroceryRequestStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { apiErrorResponse, assertSameOriginRequest, clientActorFromBody, groceryRequestHouseholdId, requireApiActor } from "@/lib/auth/api-auth";
import { transitionGroceryRequest } from "@/lib/services/grocery-service";

export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    assertSameOriginRequest(request);
    const { requestId } = await params;
    const body = await request.json().catch(() => ({}));
    const householdId = await groceryRequestHouseholdId(requestId);
    const actor = await requireApiActor(householdId, clientActorFromBody(body));
    const updated = await transitionGroceryRequest(requestId, actor.actorId, GroceryRequestStatus.PURCHASED_OFFLINE, "GROCERY_REQUEST_PURCHASED_OFFLINE");
    return NextResponse.json({ request: updated });
  } catch (error) {
    return apiErrorResponse(error, "Could not mark grocery request purchased offline.");
  }
}
