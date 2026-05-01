import { GroceryRequestStatus, GroceryUrgency } from "@prisma/client";
import { parseGroceryText } from "@/lib/grocery/parser";
import { normalizeGroceryName } from "@/lib/grocery/synonyms";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "./audit-service";
import { assertHouseholdPermission } from "./permissions-service";

type AddRequestInput = {
  householdId: string;
  rawText: string;
  requestedBy: string;
  urgency?: GroceryUrgency;
  notes?: string;
};

export async function addGroceryRequests(input: AddRequestInput) {
  await assertHouseholdPermission(input.householdId, input.requestedBy, "grocery:add");

  const parsedItems = parseGroceryText(input.rawText);
  const results = [];

  for (const item of parsedItems) {
    const groceryItem = await upsertGroceryItem(item.canonicalName, item.displayName, item.category, item.unit);
    const existing = await prisma.groceryRequest.findFirst({
      where: {
        householdId: input.householdId,
        canonicalName: item.canonicalName,
        status: GroceryRequestStatus.PENDING
      },
      orderBy: { createdAt: "desc" }
    });

    if (existing && quantitiesAreMergeable(existing.unit, item.unit)) {
      const updated = await prisma.groceryRequest.update({
        where: { id: existing.id },
        data: {
          quantity: mergeQuantity(existing.quantity, item.quantity),
          unit: existing.unit ?? item.unit,
          rawText: `${existing.rawText}\n${input.rawText}`,
          notes: [existing.notes, input.notes, `Merged duplicate request for ${item.displayName}.`].filter(Boolean).join("\n")
        }
      });

      await writeAuditLog({
        householdId: input.householdId,
        actorId: input.requestedBy,
        action: "GROCERY_REQUEST_MERGED",
        entityType: "GroceryRequest",
        entityId: updated.id,
        before: existing,
        after: updated
      });

      results.push(updated);
      continue;
    }

    const created = await prisma.groceryRequest.create({
      data: {
        householdId: input.householdId,
        groceryItemId: groceryItem.id,
        rawText: input.rawText,
        canonicalName: item.canonicalName,
        displayName: item.displayName,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        urgency: input.urgency ?? GroceryUrgency.MEDIUM,
        requestedBy: input.requestedBy,
        notes: input.notes
      }
    });

    await writeAuditLog({
      householdId: input.householdId,
      actorId: input.requestedBy,
      action: "GROCERY_REQUEST_CREATED",
      entityType: "GroceryRequest",
      entityId: created.id,
      after: created
    });

    results.push(created);
  }

  return { parsedItems, requests: results };
}

export async function updateGroceryRequest(requestId: string, actorId: string, updates: {
  displayName?: string;
  quantity?: number | null;
  unit?: string | null;
  urgency?: GroceryUrgency;
  notes?: string | null;
}) {
  const existing = await prisma.groceryRequest.findUniqueOrThrow({ where: { id: requestId } });
  await assertHouseholdPermission(existing.householdId, actorId, "grocery:edit");

  const normalized = updates.displayName ? normalizeGroceryName(updates.displayName) : null;
  const updated = await prisma.groceryRequest.update({
    where: { id: requestId },
    data: {
      displayName: updates.displayName ?? undefined,
      canonicalName: normalized?.canonicalName,
      category: normalized?.category,
      quantity: updates.quantity,
      unit: updates.unit,
      urgency: updates.urgency,
      notes: updates.notes
    }
  });

  await writeAuditLog({
    householdId: existing.householdId,
    actorId,
    action: "GROCERY_REQUEST_UPDATED",
    entityType: "GroceryRequest",
    entityId: requestId,
    before: existing,
    after: updated
  });

  return updated;
}

export async function transitionGroceryRequest(requestId: string, actorId: string, status: GroceryRequestStatus, action: string) {
  const existing = await prisma.groceryRequest.findUniqueOrThrow({ where: { id: requestId } });
  await assertHouseholdPermission(existing.householdId, actorId, status === GroceryRequestStatus.PURCHASED_OFFLINE ? "grocery:edit" : "grocery:approve");

  const updated = await prisma.groceryRequest.update({
    where: { id: requestId },
    data: { status }
  });

  await writeAuditLog({
    householdId: existing.householdId,
    actorId,
    action,
    entityType: "GroceryRequest",
    entityId: requestId,
    before: existing,
    after: updated
  });

  return updated;
}

async function upsertGroceryItem(canonicalName: string, displayName: string, category: string, defaultUnit: string | null) {
  return prisma.groceryItem.upsert({
    where: { canonicalName },
    update: {
      displayName,
      category,
      defaultUnit
    },
    create: {
      canonicalName,
      displayName,
      category,
      defaultUnit,
      synonyms: []
    }
  });
}

function quantitiesAreMergeable(existingUnit: string | null, incomingUnit: string | null) {
  return existingUnit === incomingUnit || existingUnit === null || incomingUnit === null;
}

function mergeQuantity(existing: number | null, incoming: number | null) {
  if (existing === null) return incoming;
  if (incoming === null) return existing;
  return existing + incoming;
}
