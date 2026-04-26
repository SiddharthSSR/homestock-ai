import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultActorId } from "@/lib/services/household-service";
import { writeAuditLog } from "@/lib/services/audit-service";

export async function GET() {
  const households = await prisma.household.findMany({
    include: { members: { include: { user: true } } },
    orderBy: { createdAt: "asc" }
  });
  return NextResponse.json({ households });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await request.json() : Object.fromEntries((await request.formData()).entries());
  const actorId = String(body.createdBy || body.actorId || (await getDefaultActorId()));

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
}
