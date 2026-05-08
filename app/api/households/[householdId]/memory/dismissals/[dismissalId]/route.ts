import { NextResponse } from "next/server";
import { apiErrorResponse, assertSameOriginRequest, requireApiActor } from "@/lib/auth/api-auth";
import { restoreMemorySuggestionDismissal } from "@/lib/services/memory-service";

export async function DELETE(request: Request, { params }: { params: Promise<{ householdId: string; dismissalId: string }> }) {
  try {
    assertSameOriginRequest(request);
    const { householdId, dismissalId } = await params;
    const url = new URL(request.url);
    const actor = await requireApiActor(householdId, url.searchParams.get("actorId"));
    const dismissal = await restoreMemorySuggestionDismissal(householdId, dismissalId, actor.actorId);
    return NextResponse.json({ dismissal });
  } catch (error) {
    return apiErrorResponse(error, "Could not restore memory suggestion.");
  }
}
