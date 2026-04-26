import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ householdId: string }> }) {
  const { householdId } = await params;
  const carts = await prisma.cartDraft.findMany({
    where: { householdId },
    include: { items: true },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ carts });
}
