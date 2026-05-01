import { GroceryUrgency } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addGroceryRequests } from "@/lib/services/grocery-service";
import { getDefaultActorId } from "@/lib/services/household-service";
import { PermissionError } from "@/lib/services/permissions-service";

export async function GET(_request: Request, { params }: { params: Promise<{ householdId: string }> }) {
  const { householdId } = await params;
  const requests = await prisma.groceryRequest.findMany({
    where: { householdId },
    orderBy: [{ status: "asc" }, { category: "asc" }, { createdAt: "desc" }]
  });
  return NextResponse.json({ requests });
}

export async function POST(request: Request, { params }: { params: Promise<{ householdId: string }> }) {
  try {
    const { householdId } = await params;
    const body = await request.json();
    const actorId = String(body.requestedBy || body.actorId || (await getDefaultActorId()));

    const result = await addGroceryRequests({
      householdId,
      rawText: String(body.rawText),
      requestedBy: actorId,
      urgency: body.urgency as GroceryUrgency,
      notes: body.notes ? String(body.notes) : undefined
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save grocery requests." }, { status: error instanceof PermissionError ? 403 : 400 });
  }
}
