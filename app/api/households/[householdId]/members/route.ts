import { HouseholdRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultActorId } from "@/lib/services/household-service";
import { writeAuditLog } from "@/lib/services/audit-service";

export async function POST(request: Request, { params }: { params: Promise<{ householdId: string }> }) {
  const { householdId } = await params;
  const contentType = request.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await request.json() : Object.fromEntries((await request.formData()).entries());
  const actorId = String(body.actorId || (await getDefaultActorId()));

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
    return NextResponse.redirect(new URL("/household", request.url), 303);
  }

  return NextResponse.json({ member });
}
