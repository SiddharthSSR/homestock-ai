import { NextResponse } from "next/server";
import { apiErrorResponse, assertSameOriginRequest, clientActorFromBody, requireApiActor } from "@/lib/auth/api-auth";
import { serializeGroceryItems } from "@/lib/grocery/serialize";
import { addGroceryRequests } from "@/lib/services/grocery-service";
import { assertHouseholdPermission } from "@/lib/services/permissions-service";

export async function POST(request: Request, { params }: { params: Promise<{ householdId: string }> }) {
  try {
    assertSameOriginRequest(request);
    const { householdId } = await params;
    const body = await request.json();
    const actor = await requireApiActor(householdId, clientActorFromBody(body));
    const actorId = actor.actorId;
    await assertHouseholdPermission(householdId, actorId, "memory:add-suggestion");

    const displayName = String(body.displayName || "").trim();

    if (!displayName) {
      return NextResponse.json({ error: "Suggestion display name is required." }, { status: 400 });
    }

    const quantity = body.suggestedQuantity === null || body.suggestedQuantity === undefined || body.suggestedQuantity === "" ? null : Number(body.suggestedQuantity);

    if (quantity !== null && (!Number.isFinite(quantity) || quantity < 0)) {
      return NextResponse.json({ error: "Suggestion quantity must be a positive number." }, { status: 400 });
    }

    const rawText = serializeGroceryItems([
      {
        displayName,
        quantity,
        unit: body.suggestedUnit ? String(body.suggestedUnit) : null
      }
    ]);
    const reason = body.reason ? String(body.reason) : "Memory suggestion";
    const result = await addGroceryRequests({
      householdId,
      rawText,
      requestedBy: actorId,
      notes: `Memory suggestion: ${reason}`
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Could not add memory suggestion.");
  }
}
