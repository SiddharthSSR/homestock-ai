import { GroceryRequestStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getDefaultActorId } from "@/lib/services/household-service";
import { transitionGroceryRequest } from "@/lib/services/grocery-service";
import { PermissionError } from "@/lib/services/permissions-service";

export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const { requestId } = await params;
    const body = await request.json().catch(() => ({}));
    const actorId = String(body.actorId || (await getDefaultActorId()));
    const updated = await transitionGroceryRequest(requestId, actorId, GroceryRequestStatus.PURCHASED_OFFLINE, "GROCERY_REQUEST_PURCHASED_OFFLINE");
    return NextResponse.json({ request: updated });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not mark grocery request purchased offline." }, { status: error instanceof PermissionError ? 403 : 400 });
  }
}
