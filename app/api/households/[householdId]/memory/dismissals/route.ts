import { NextResponse } from "next/server";
import { apiErrorResponse, assertSameOriginRequest, clientActorFromBody, requireApiActor } from "@/lib/auth/api-auth";
import { dismissMemorySuggestion, getActiveMemoryDismissals, type MemorySuggestionSource, type MemorySuggestionType } from "@/lib/services/memory-service";

const suggestionTypes = new Set<MemorySuggestionType>(["DUE_SOON", "MONTHLY_STAPLE", "FREQUENT_ITEM", "PREFERENCE"]);
const suggestionSources = new Set<MemorySuggestionSource>(["learned", "saved-pattern", "setup"]);

export async function GET(request: Request, { params }: { params: Promise<{ householdId: string }> }) {
  try {
    const { householdId } = await params;
    const actorId = new URL(request.url).searchParams.get("actorId");
    await requireApiActor(householdId, actorId);
    const dismissals = await getActiveMemoryDismissals(householdId);
    return NextResponse.json({ dismissals });
  } catch (error) {
    return apiErrorResponse(error, "Could not list memory dismissals.");
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ householdId: string }> }) {
  try {
    assertSameOriginRequest(request);
    const { householdId } = await params;
    const body = await request.json();
    const actor = await requireApiActor(householdId, clientActorFromBody(body));
    const suggestionKey = String(body.suggestionKey || "").trim();
    const canonicalName = String(body.canonicalName || "").trim();
    const displayName = String(body.displayName || "").trim();
    const suggestionType = String(body.suggestionType || "") as MemorySuggestionType;
    const source = String(body.source || "") as MemorySuggestionSource;
    const dismissDays = body.dismissDays === undefined || body.dismissDays === null || body.dismissDays === "" ? 7 : Number(body.dismissDays);

    if (!suggestionKey || !canonicalName || !displayName) {
      return NextResponse.json({ error: "Suggestion key, canonical name, and display name are required." }, { status: 400 });
    }

    if (!suggestionTypes.has(suggestionType)) {
      return NextResponse.json({ error: "Invalid suggestion type." }, { status: 400 });
    }

    if (!suggestionSources.has(source)) {
      return NextResponse.json({ error: "Invalid suggestion source." }, { status: 400 });
    }

    if (!Number.isFinite(dismissDays) || dismissDays < 0 || dismissDays > 365) {
      return NextResponse.json({ error: "Dismissal window must be between 0 and 365 days." }, { status: 400 });
    }

    const dismissal = await dismissMemorySuggestion({
      householdId,
      actorId: actor.actorId,
      suggestionKey,
      canonicalName,
      displayName,
      suggestionType,
      source,
      dismissDays,
      reason: body.reason ? String(body.reason) : null
    });

    return NextResponse.json({ dismissal }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Could not dismiss memory suggestion.");
  }
}
