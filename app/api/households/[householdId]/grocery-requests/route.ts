import { GroceryUrgency } from "@prisma/client";
import { NextResponse } from "next/server";
import { apiErrorResponse, assertSameOriginRequest, clientActorFromBody, requireApiActor } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import { addGroceryRequests } from "@/lib/services/grocery-service";

export async function GET(request: Request, { params }: { params: Promise<{ householdId: string }> }) {
  try {
    const { householdId } = await params;
    const actorId = new URL(request.url).searchParams.get("actorId");
    await requireApiActor(householdId, actorId);
    const requests = await prisma.groceryRequest.findMany({
      where: { householdId },
      orderBy: [{ status: "asc" }, { category: "asc" }, { createdAt: "desc" }]
    });
    return NextResponse.json({ requests });
  } catch (error) {
    return apiErrorResponse(error, "Could not list grocery requests.");
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ householdId: string }> }) {
  try {
    assertSameOriginRequest(request);
    const { householdId } = await params;
    const body = await request.json();
    const actor = await requireApiActor(householdId, clientActorFromBody(body, ["requestedBy", "actorId"]));

    const result = await addGroceryRequests({
      householdId,
      rawText: String(body.rawText),
      requestedBy: actor.actorId,
      urgency: body.urgency as GroceryUrgency,
      notes: body.notes ? String(body.notes) : undefined
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Could not save grocery requests.");
  }
}
