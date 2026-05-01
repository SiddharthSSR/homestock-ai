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
    const updated = await transitionGroceryRequest(requestId, actorId, GroceryRequestStatus.APPROVED, "GROCERY_REQUEST_APPROVED");
    return NextResponse.json({ request: updated });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not approve grocery request." }, { status: error instanceof PermissionError ? 403 : 400 });
  }
}
