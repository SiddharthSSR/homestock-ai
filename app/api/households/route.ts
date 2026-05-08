import { NextResponse } from "next/server";
import { apiErrorResponse, assertSameOriginRequest, requireApiSessionUserId } from "@/lib/auth/api-auth";
import { isDemoModeEnabled } from "@/lib/household-selection";
import { prisma } from "@/lib/prisma";
import { getDefaultActorId } from "@/lib/services/household-service";
import { writeAuditLog } from "@/lib/services/audit-service";

export async function GET() {
  try {
    const userId = isDemoModeEnabled() ? null : await requireApiSessionUserId();
    const households = await prisma.household.findMany({
      where: userId ? { members: { some: { userId } } } : undefined,
      include: { members: { include: { user: true } } },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json({ households });
  } catch (error) {
    return apiErrorResponse(error, "Could not list households.");
  }
}

export async function POST(request: Request) {
  try {
    assertSameOriginRequest(request);
    const contentType = request.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json") ? await request.json() : Object.fromEntries((await request.formData()).entries());
    const actorId = isDemoModeEnabled() ? String(body.createdBy || body.actorId || (await getDefaultActorId())) : await requireApiSessionUserId();

    const household = await prisma.household.create({
      data: {
        name: String(body.name),
        location: body.location ? String(body.location) : null,
        createdBy: actorId,
        members: { create: { userId: actorId, role: "ADMIN" } }
      }
    });

    await writeAuditLog({
      householdId: household.id,
      actorId,
      action: "HOUSEHOLD_CREATED",
      entityType: "Household",
      entityId: household.id,
      after: household
    });

    if (!contentType.includes("application/json")) {
      return NextResponse.redirect(new URL("/household", request.url), 303);
    }

    return NextResponse.json({ household }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Could not create household.");
  }
}
