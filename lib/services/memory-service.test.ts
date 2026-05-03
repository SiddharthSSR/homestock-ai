import { describe, expect, it } from "vitest";
import { filterDismissedMemory, generateHouseholdMemory, type MemoryDismissalRecord, type MemoryHistoryEvent } from "./memory-service";

const now = new Date("2026-04-30T10:00:00.000Z");

function daysAgo(days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function event(overrides: Partial<MemoryHistoryEvent> = {}): MemoryHistoryEvent {
  return {
    canonicalName: "milk",
    displayName: "Milk",
    category: "Dairy",
    quantity: 1,
    unit: "litre",
    seenAt: daysAgo(0),
    ...overrides
  };
}

function dismissal(overrides: Partial<MemoryDismissalRecord> = {}): MemoryDismissalRecord {
  return {
    id: "dismissal-1",
    householdId: "household-1",
    suggestionKey: "due-milk",
    canonicalName: "milk",
    displayName: "Milk",
    suggestionType: "DUE_SOON",
    source: "learned",
    dismissedBy: "user-1",
    dismissedAt: daysAgo(0),
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    reason: "Milk — usually expected every 2-3 days.",
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
    ...overrides
  };
}

describe("generateHouseholdMemory", () => {
  it("detects due soon items from repeated recurring activity", () => {
    const memory = generateHouseholdMemory({
      now,
      events: [
        event({ seenAt: daysAgo(9) }),
        event({ seenAt: daysAgo(6) }),
        event({ seenAt: daysAgo(3) })
      ]
    });

    expect(memory.dueSoon[0]).toMatchObject({
      canonicalName: "milk",
      type: "DUE_SOON",
      isFallback: false,
      suggestedQuantity: 1,
      suggestedUnit: "litre"
    });
    expect(memory.dueSoon[0].reason).toContain("usually expected every 2-3 days");
  });

  it("does not claim learned recurrence when household data is insufficient", () => {
    const memory = generateHouseholdMemory({
      now,
      events: [event({ seenAt: daysAgo(1) })]
    });

    expect(memory.fallbackUsed).toBe(true);
    expect(memory.dueSoon).toHaveLength(0);
    expect(memory.monthlyStaples.every((suggestion) => suggestion.isFallback)).toBe(true);
    expect(memory.frequentItems.every((suggestion) => suggestion.reason.startsWith("Setup suggestion:"))).toBe(true);
  });

  it("classifies roughly monthly staples", () => {
    const memory = generateHouseholdMemory({
      now,
      events: [
        event({
          canonicalName: "atta",
          displayName: "Atta",
          category: "Staples",
          quantity: 5,
          unit: "kg",
          seenAt: daysAgo(60)
        }),
        event({
          canonicalName: "atta",
          displayName: "Atta",
          category: "Staples",
          quantity: 5,
          unit: "kg",
          seenAt: daysAgo(30)
        }),
        event({
          canonicalName: "atta",
          displayName: "Atta",
          category: "Staples",
          quantity: 5,
          unit: "kg",
          seenAt: daysAgo(0)
        })
      ]
    });

    expect(memory.monthlyStaples[0]).toMatchObject({
      canonicalName: "atta",
      type: "MONTHLY_STAPLE",
      isFallback: false,
      suggestedQuantity: 5,
      suggestedUnit: "kg"
    });
    expect(memory.monthlyStaples[0].reason).toContain("roughly monthly");
  });

  it("surfaces frequent items after repeated household activity", () => {
    const memory = generateHouseholdMemory({
      now,
      events: [
        event({ canonicalName: "eggs", displayName: "Eggs", category: "Protein", quantity: 30, unit: "piece", seenAt: daysAgo(21) }),
        event({ canonicalName: "eggs", displayName: "Eggs", category: "Protein", quantity: 30, unit: "piece", seenAt: daysAgo(14) }),
        event({ canonicalName: "eggs", displayName: "Eggs", category: "Protein", quantity: 30, unit: "piece", seenAt: daysAgo(7) })
      ]
    });

    expect(memory.frequentItems[0]).toMatchObject({
      canonicalName: "eggs",
      type: "FREQUENT_ITEM",
      isFallback: false
    });
    expect(memory.frequentItems[0].reason).toContain("3 times");
  });

  it("uses saved patterns without requiring raw event history", () => {
    const memory = generateHouseholdMemory({
      now,
      events: [],
      patterns: [
        {
          averageIntervalDays: 2,
          usualQuantity: 1,
          usualUnit: "litre",
          preferredBrand: "Akshayakalpa",
          lastOrderedAt: daysAgo(3),
          confidenceScore: 0.74,
          groceryItem: {
            canonicalName: "milk",
            displayName: "Milk",
            category: "Dairy"
          }
        }
      ]
    });

    expect(memory.fallbackUsed).toBe(false);
    expect(memory.dueSoon[0]).toMatchObject({
      canonicalName: "milk",
      source: "saved-pattern",
      suggestedQuantity: 1
    });
    expect(memory.learnedPreferences[0].reason).toContain("Akshayakalpa");
  });

  it("filters active dismissed suggestions by suggestion key", () => {
    const memory = generateHouseholdMemory({
      now,
      events: [
        event({ seenAt: daysAgo(9) }),
        event({ seenAt: daysAgo(6) }),
        event({ seenAt: daysAgo(3) })
      ]
    });

    const filtered = filterDismissedMemory(memory, [dismissal()], now);

    expect(memory.dueSoon).toHaveLength(1);
    expect(filtered.dueSoon).toHaveLength(0);
  });

  it("does not filter expired dismissed suggestions", () => {
    const memory = generateHouseholdMemory({
      now,
      events: [
        event({ seenAt: daysAgo(9) }),
        event({ seenAt: daysAgo(6) }),
        event({ seenAt: daysAgo(3) })
      ]
    });

    const filtered = filterDismissedMemory(memory, [dismissal({ expiresAt: daysAgo(1) })], now);

    expect(filtered.dueSoon).toHaveLength(1);
  });

  it("filters setup suggestions without treating them as learned history", () => {
    const memory = generateHouseholdMemory({
      now,
      events: []
    });

    const filtered = filterDismissedMemory(
      memory,
      [
        dismissal({
          suggestionKey: "setup-milk",
          canonicalName: "milk",
          suggestionType: "FREQUENT_ITEM",
          source: "setup"
        })
      ],
      now
    );

    expect(memory.frequentItems.some((suggestion) => suggestion.id === "setup-milk" && suggestion.isFallback)).toBe(true);
    expect(filtered.frequentItems.some((suggestion) => suggestion.id === "setup-milk")).toBe(false);
    expect(filtered.fallbackUsed).toBe(true);
  });

  it("only filters the matching suggestion when an item has multiple memory controls", () => {
    const memory = generateHouseholdMemory({
      now,
      events: [
        event({ canonicalName: "eggs", displayName: "Eggs", category: "Protein", quantity: 30, unit: "piece", seenAt: daysAgo(21) }),
        event({ canonicalName: "eggs", displayName: "Eggs", category: "Protein", quantity: 30, unit: "piece", seenAt: daysAgo(14) }),
        event({ canonicalName: "eggs", displayName: "Eggs", category: "Protein", quantity: 30, unit: "piece", seenAt: daysAgo(7) })
      ]
    });

    const filtered = filterDismissedMemory(
      memory,
      [
        dismissal({
          suggestionKey: "due-eggs",
          canonicalName: "eggs",
          suggestionType: "DUE_SOON",
          source: "learned"
        })
      ],
      now
    );

    expect(filtered.dueSoon.some((suggestion) => suggestion.canonicalName === "eggs")).toBe(false);
    expect(filtered.frequentItems.some((suggestion) => suggestion.canonicalName === "eggs")).toBe(true);
  });
});
