import { NextResponse } from "next/server";
import { getDefaultActorId } from "@/lib/services/household-service";
import { restoreMemorySuggestionDismissal } from "@/lib/services/memory-service";
import { PermissionError } from "@/lib/services/permissions-service";

export async function DELETE(request: Request, { params }: { params: Promise<{ householdId: string; dismissalId: string }> }) {
  try {
    const { householdId, dismissalId } = await params;
    const url = new URL(request.url);
    const actorId = url.searchParams.get("actorId") ?? (await getDefaultActorId());
    const dismissal = await restoreMemorySuggestionDismissal(householdId, dismissalId, actorId);
    return NextResponse.json({ dismissal });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not restore memory suggestion." }, { status: error instanceof PermissionError ? 403 : 400 });
  }
}
