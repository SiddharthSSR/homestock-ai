import { NextResponse } from "next/server";
import { apiErrorResponse, requireApiActor } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ householdId: string }> }) {
  try {
    const { householdId } = await params;
    const actorId = new URL(request.url).searchParams.get("actorId");
    await requireApiActor(householdId, actorId);
    const carts = await prisma.cartDraft.findMany({
      where: { householdId },
      include: { items: true },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ carts });
  } catch (error) {
    return apiErrorResponse(error, "Could not list carts.");
  }
}
