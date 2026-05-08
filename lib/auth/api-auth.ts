import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { isDemoModeEnabled } from "@/lib/household-selection";
import { prisma } from "@/lib/prisma";
import { PermissionError } from "@/lib/services/permissions-service";
import {
  AuthRequiredError,
  HouseholdForbiddenError,
  HouseholdRequiredError,
  requireCurrentActor
} from "./current-actor";

export class InvalidOriginError extends Error {
  status = 403;

  constructor() {
    super("Invalid request origin");
    this.name = "InvalidOriginError";
  }
}

export class ApiNotFoundError extends Error {
  status = 404;

  constructor(message = "Resource not found") {
    super(message);
    this.name = "ApiNotFoundError";
  }
}

export async function requireApiActor(householdId: string | null | undefined, clientActorId?: string | null) {
  return requireCurrentActor(householdId, { queryActorId: clientActorId });
}

export async function requireApiSessionUserId() {
  if (isDemoModeEnabled()) {
    throw new HouseholdRequiredError();
  }

  const mod = await import("@/lib/auth/config");
  const session = await mod.auth();
  const userId = session?.user?.id ?? null;
  if (!userId) throw new AuthRequiredError();
  return userId;
}

export function assertSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;

  const requestOrigin = new URL(request.url).origin;
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin : requestOrigin;

  if (origin !== requestOrigin && origin !== appOrigin) {
    throw new InvalidOriginError();
  }
}

export function clientActorFromBody(body: Record<string, unknown>, keys: string[] = ["actorId"]) {
  for (const key of keys) {
    const value = body[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

export async function groceryRequestHouseholdId(requestId: string) {
  const request = await prisma.groceryRequest.findUnique({
    where: { id: requestId },
    select: { householdId: true }
  });
  if (!request) throw new ApiNotFoundError("Grocery request not found");
  return request.householdId;
}

export async function cartDraftHouseholdId(cartId: string) {
  const cart = await prisma.cartDraft.findUnique({
    where: { id: cartId },
    select: { householdId: true }
  });
  if (!cart) throw new ApiNotFoundError("Cart draft not found");
  return cart.householdId;
}

export async function cartItemHouseholdId(cartItemId: string) {
  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    select: { cartDraft: { select: { householdId: true } } }
  });
  if (!item) throw new ApiNotFoundError("Cart item not found");
  return item.cartDraft.householdId;
}

export function apiErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AuthRequiredError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (
    error instanceof HouseholdForbiddenError ||
    error instanceof PermissionError ||
    error instanceof InvalidOriginError
  ) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Forbidden" }, { status: 403 });
  }

  if (error instanceof HouseholdRequiredError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof ApiNotFoundError || (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Resource not found" }, { status: 404 });
  }

  return NextResponse.json({ error: error instanceof Error ? error.message : fallbackMessage }, { status: 400 });
}
