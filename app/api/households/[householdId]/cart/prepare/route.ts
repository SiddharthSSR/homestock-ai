import { NextResponse } from "next/server";
import { prepareMockCart } from "@/lib/services/cart-service";
import { getDefaultActorId } from "@/lib/services/household-service";
import { PermissionError } from "@/lib/services/permissions-service";

export async function POST(request: Request, { params }: { params: Promise<{ householdId: string }> }) {
  try {
    const { householdId } = await params;
    const body = await request.json().catch(() => ({}));
    const actorId = String(body.actorId || (await getDefaultActorId()));
    const cart = await prepareMockCart(householdId, actorId);
    return NextResponse.json({ cart }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not prepare mock cart." }, { status: error instanceof PermissionError ? 403 : 400 });
  }
}
