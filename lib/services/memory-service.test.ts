import { describe, expect, it } from "vitest";
import { generateHouseholdMemory, type MemoryHistoryEvent } from "./memory-service";

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
    expect(memory.dueSoon[0].reason).toContain("usually appears every 2-3 days");
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
});
