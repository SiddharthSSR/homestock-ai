import { GroceryUrgency } from "@prisma/client";
import { NextResponse } from "next/server";
import { getDefaultActorId } from "@/lib/services/household-service";
import { updateGroceryRequest } from "@/lib/services/grocery-service";

export async function PATCH(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const body = await request.json();
  const actorId = String(body.actorId || (await getDefaultActorId()));

  const updated = await updateGroceryRequest(requestId, actorId, {
    displayName: body.displayName ? String(body.displayName) : undefined,
    quantity: body.quantity === undefined ? undefined : body.quantity === null ? null : Number(body.quantity),
    unit: body.unit === undefined ? undefined : body.unit === null ? null : String(body.unit),
    urgency: body.urgency as GroceryUrgency | undefined,
    notes: body.notes === undefined ? undefined : body.notes === null ? null : String(body.notes)
  });

  return NextResponse.json({ request: updated });
}
