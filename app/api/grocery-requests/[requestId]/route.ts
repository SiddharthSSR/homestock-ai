import { GroceryUrgency } from "@prisma/client";
import { NextResponse } from "next/server";
import { apiErrorResponse, assertSameOriginRequest, clientActorFromBody, groceryRequestHouseholdId, requireApiActor } from "@/lib/auth/api-auth";
import { updateGroceryRequest } from "@/lib/services/grocery-service";

export async function PATCH(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    assertSameOriginRequest(request);
    const { requestId } = await params;
    const body = await request.json();
    const householdId = await groceryRequestHouseholdId(requestId);
    const actor = await requireApiActor(householdId, clientActorFromBody(body));

    const updated = await updateGroceryRequest(requestId, actor.actorId, {
      displayName: body.displayName ? String(body.displayName) : undefined,
      quantity: body.quantity === undefined ? undefined : body.quantity === null ? null : Number(body.quantity),
      unit: body.unit === undefined ? undefined : body.unit === null ? null : String(body.unit),
      urgency: body.urgency as GroceryUrgency | undefined,
      notes: body.notes === undefined ? undefined : body.notes === null ? null : String(body.notes)
    });

    return NextResponse.json({ request: updated });
  } catch (error) {
    return apiErrorResponse(error, "Could not update grocery request.");
  }
}
