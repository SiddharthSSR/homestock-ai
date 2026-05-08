import { HouseholdRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { apiErrorResponse, assertSameOriginRequest, clientActorFromBody, requireApiActor } from "@/lib/auth/api-auth";
import { isDemoModeEnabled } from "@/lib/household-selection";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/services/audit-service";
import { assertHouseholdPermission } from "@/lib/services/permissions-service";

export async function POST(request: Request, { params }: { params: Promise<{ householdId: string }> }) {
  try {
    assertSameOriginRequest(request);
    const { householdId } = await params;
    const contentType = request.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json") ? await request.json() : Object.fromEntries((await request.formData()).entries());
    const actor = await requireApiActor(householdId, clientActorFromBody(body));
    const actorId = actor.actorId;
    await assertHouseholdPermission(householdId, actorId, "household:manage");

    const member = await prisma.householdMember.upsert({
      where: {
        householdId_userId: {
          householdId,
          userId: String(body.userId)
        }
      },
      update: {
        role: String(body.role) as HouseholdRole
      },
      create: {
        householdId,
        userId: String(body.userId),
        role: String(body.role) as HouseholdRole
      }
    });

    await writeAuditLog({
      householdId,
      actorId,
      action: "HOUSEHOLD_MEMBER_UPSERTED",
      entityType: "HouseholdMember",
      entityId: member.id,
      after: member
    });

    if (!contentType.includes("application/json")) {
      const redirectUrl = new URL(`/household?householdId=${householdId}`, request.url);
      if (isDemoModeEnabled()) redirectUrl.searchParams.set("actorId", actorId);
      return NextResponse.redirect(redirectUrl, 303);
    }

    return NextResponse.json({ member });
  } catch (error) {
    return apiErrorResponse(error, "Could not update household member.");
  }
}
