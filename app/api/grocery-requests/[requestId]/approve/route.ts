import { GroceryRequestStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getDefaultActorId } from "@/lib/services/household-service";
import { transitionGroceryRequest } from "@/lib/services/grocery-service";

export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const body = await request.json().catch(() => ({}));
  const actorId = String(body.actorId || (await getDefaultActorId()));
  const updated = await transitionGroceryRequest(requestId, actorId, GroceryRequestStatus.APPROVED, "GROCERY_REQUEST_APPROVED");
  return NextResponse.json({ request: updated });
}
