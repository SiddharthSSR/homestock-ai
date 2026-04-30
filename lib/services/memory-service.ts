import type { GroceryItem, GroceryPreference, RecurringPattern } from "@prisma/client";
import { GroceryRequestStatus } from "@prisma/client";
import { groceryCatalogSeeds } from "../grocery/synonyms";
import { prisma } from "../prisma";

export type MemorySuggestionType = "DUE_SOON" | "MONTHLY_STAPLE" | "FREQUENT_ITEM" | "PREFERENCE";
export type MemorySuggestionSource = "learned" | "saved-pattern" | "setup";

export type MemorySuggestion = {
  id: string;
  type: MemorySuggestionType;
  canonicalName: string;
  displayName: string;
  category: string;
  reason: string;
  confidence: number;
  lastSeenAt: Date | null;
  suggestedQuantity: number | null;
  suggestedUnit: string | null;
  actionLabel: string;
  source: MemorySuggestionSource;
  isFallback: boolean;
};

export type HouseholdMemory = {
  dueSoon: MemorySuggestion[];
  monthlyStaples: MemorySuggestion[];
  frequentItems: MemorySuggestion[];
  learnedPreferences: MemorySuggestion[];
  fallbackUsed: boolean;
  generatedAt: Date;
};

export type MemoryHistoryEvent = {
  canonicalName: string;
  displayName: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  seenAt: Date;
  brand?: string | null;
};

export type RecurringPatternInput = Pick<RecurringPattern, "averageIntervalDays" | "usualQuantity" | "usualUnit" | "preferredBrand" | "lastOrderedAt" | "confidenceScore"> & {
  groceryItem: Pick<GroceryItem, "canonicalName" | "displayName" | "category">;
};

export type GroceryPreferenceInput = Pick<GroceryPreference, "preferredBrand" | "preferredQuantity" | "preferredUnit"> & {
  groceryItem: Pick<GroceryItem, "canonicalName" | "displayName" | "category">;
};

const meaningfulStatuses = [
  GroceryRequestStatus.APPROVED,
  GroceryRequestStatus.ADDED_TO_CART,
  GroceryRequestStatus.ORDERED,
  GroceryRequestStatus.PURCHASED_OFFLINE
];

const monthlyCategories = new Set(["Staples", "Cooking", "Spices"]);
const setupSuggestionNames = ["milk", "eggs", "atta", "oil"];

export async function getHouseholdMemory(householdId: string, now = new Date()): Promise<HouseholdMemory> {
  const [requests, patterns, preferences] = await Promise.all([
    prisma.groceryRequest.findMany({
      where: {
        householdId,
        status: { in: meaningfulStatuses }
      },
      include: {
        groceryItem: true,
        cartItems: {
          include: {
            cartDraft: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.recurringPattern.findMany({
      where: { householdId },
      include: { groceryItem: true },
      orderBy: [{ confidenceScore: "desc" }, { updatedAt: "desc" }]
    }),
    prisma.groceryPreference.findMany({
      where: { householdId },
      include: { groceryItem: true },
      orderBy: { updatedAt: "desc" }
    })
  ]);

  const events: MemoryHistoryEvent[] = requests.flatMap((request) => {
    if (request.cartItems.length) {
      return request.cartItems.map((item) => ({
        canonicalName: request.canonicalName,
        displayName: request.displayName,
        category: request.category,
        quantity: item.quantity ?? request.quantity,
        unit: request.unit ?? item.unit,
        seenAt: item.cartDraft.approvedAt ?? item.cartDraft.createdAt,
        brand: item.brand
      }));
    }

    return [
      {
        canonicalName: request.canonicalName,
        displayName: request.displayName,
        category: request.category,
        quantity: request.quantity,
        unit: request.unit,
        seenAt: request.updatedAt,
        brand: null
      }
    ];
  });

  return generateHouseholdMemory({ events, patterns, preferences, now });
}

export function generateHouseholdMemory({
  events,
  patterns = [],
  preferences = [],
  now = new Date()
}: {
  events: MemoryHistoryEvent[];
  patterns?: RecurringPatternInput[];
  preferences?: GroceryPreferenceInput[];
  now?: Date;
}): HouseholdMemory {
  const dueSoon: MemorySuggestion[] = [];
  const monthlyStaples: MemorySuggestion[] = [];
  const frequentItems: MemorySuggestion[] = [];
  const learnedPreferences: MemorySuggestion[] = [];
  const groupedEvents = groupEvents(events);

  for (const pattern of patterns) {
    const suggestion = suggestionFromPattern(pattern, now);
    if (!suggestion) continue;
    if (suggestion.type === "DUE_SOON") dueSoon.push(suggestion);
    if (suggestion.type === "MONTHLY_STAPLE") monthlyStaples.push(suggestion);
    if (pattern.preferredBrand) learnedPreferences.push(preferenceFromPattern(pattern));
  }

  for (const [canonicalName, itemEvents] of groupedEvents) {
    const sorted = [...itemEvents].sort((a, b) => a.seenAt.getTime() - b.seenAt.getTime());
    const latest = sorted[sorted.length - 1];
    const intervals = calculateIntervals(sorted.map((event) => event.seenAt));
    const medianInterval = intervals.length ? median(intervals) : null;
    const daysSinceLast = daysBetween(latest.seenAt, now);
    const quantity = mostUsefulQuantity(sorted);
    const unit = mostCommon(sorted.map((event) => event.unit).filter(Boolean) as string[]);
    const confidence = confidenceFor(sorted.length, intervals.length);

    if (medianInterval && daysSinceLast >= Math.max(1, medianInterval - 1)) {
      dueSoon.push({
        id: `due-${canonicalName}`,
        type: "DUE_SOON",
        canonicalName,
        displayName: latest.displayName,
        category: latest.category,
        reason: `${latest.displayName} usually appears every ${formatInterval(medianInterval)}. Last seen ${formatDaysAgo(daysSinceLast)}.`,
        confidence,
        lastSeenAt: latest.seenAt,
        suggestedQuantity: quantity,
        suggestedUnit: unit,
        actionLabel: "Add to list",
        source: "learned",
        isFallback: false
      });
    }

    if (medianInterval && monthlyCategories.has(latest.category) && medianInterval >= 21 && medianInterval <= 45) {
      monthlyStaples.push({
        id: `monthly-${canonicalName}`,
        type: "MONTHLY_STAPLE",
        canonicalName,
        displayName: latest.displayName,
        category: latest.category,
        reason: `${latest.displayName} appears roughly monthly in this household history${quantity ? `. Add ${formatQuantity(quantity, unit)}?` : "."}`,
        confidence,
        lastSeenAt: latest.seenAt,
        suggestedQuantity: quantity,
        suggestedUnit: unit,
        actionLabel: "Add staple",
        source: "learned",
        isFallback: false
      });
    }

    if (sorted.length >= 3) {
      frequentItems.push({
        id: `frequent-${canonicalName}`,
        type: "FREQUENT_ITEM",
        canonicalName,
        displayName: latest.displayName,
        category: latest.category,
        reason: `${latest.displayName} has appeared ${sorted.length} times in household grocery activity.`,
        confidence,
        lastSeenAt: latest.seenAt,
        suggestedQuantity: quantity,
        suggestedUnit: unit,
        actionLabel: "Add again",
        source: "learned",
        isFallback: false
      });
    }

    const brand = mostCommon(sorted.map((event) => event.brand).filter(Boolean) as string[]);
    if (brand && sorted.filter((event) => event.brand === brand).length >= 2) {
      learnedPreferences.push({
        id: `preference-${canonicalName}`,
        type: "PREFERENCE",
        canonicalName,
        displayName: latest.displayName,
        category: latest.category,
        reason: `${brand} is the most common mock cart brand seen for ${latest.displayName}.`,
        confidence: Math.min(0.86, confidence),
        lastSeenAt: latest.seenAt,
        suggestedQuantity: quantity,
        suggestedUnit: unit,
        actionLabel: "Use preference",
        source: "learned",
        isFallback: false
      });
    }
  }

  for (const preference of preferences) {
    learnedPreferences.push(preferenceFromSavedPreference(preference));
  }

  const dedupedDueSoon = dedupeSuggestions(dueSoon).sort(sortByConfidence);
  const dedupedMonthly = dedupeSuggestions(monthlyStaples).sort(sortByConfidence);
  const dedupedFrequent = dedupeSuggestions(frequentItems).sort(sortByConfidence);
  const dedupedPreferences = dedupeSuggestions(learnedPreferences).sort(sortByConfidence);
  const fallbackUsed = !dedupedDueSoon.length && !dedupedMonthly.length && !dedupedFrequent.length;

  if (fallbackUsed) {
    const setupSuggestions = buildSetupSuggestions();
    dedupedDueSoon.push(...setupSuggestions.filter((suggestion) => suggestion.type === "DUE_SOON"));
    dedupedMonthly.push(...setupSuggestions.filter((suggestion) => suggestion.type === "MONTHLY_STAPLE"));
    dedupedFrequent.push(...setupSuggestions.filter((suggestion) => suggestion.type === "FREQUENT_ITEM"));
  }

  return {
    dueSoon: dedupedDueSoon.slice(0, 6),
    monthlyStaples: dedupedMonthly.slice(0, 8),
    frequentItems: dedupedFrequent.slice(0, 8),
    learnedPreferences: dedupedPreferences.slice(0, 8),
    fallbackUsed,
    generatedAt: now
  };
}

function suggestionFromPattern(pattern: RecurringPatternInput, now: Date): MemorySuggestion | null {
  if (!pattern.lastOrderedAt) return null;
  const daysSinceLast = daysBetween(pattern.lastOrderedAt, now);
  const isDue = daysSinceLast >= Math.max(1, pattern.averageIntervalDays - 1);
  const isMonthly = pattern.averageIntervalDays >= 21 && pattern.averageIntervalDays <= 45 && monthlyCategories.has(pattern.groceryItem.category);

  if (!isDue && !isMonthly) return null;

  return {
    id: `${isDue ? "due" : "monthly"}-pattern-${pattern.groceryItem.canonicalName}`,
    type: isDue ? "DUE_SOON" : "MONTHLY_STAPLE",
    canonicalName: pattern.groceryItem.canonicalName,
    displayName: pattern.groceryItem.displayName,
    category: pattern.groceryItem.category,
    reason: `${pattern.groceryItem.displayName} usually appears every ${formatInterval(pattern.averageIntervalDays)}. Last seen ${formatDaysAgo(daysSinceLast)}.`,
    confidence: pattern.confidenceScore,
    lastSeenAt: pattern.lastOrderedAt,
    suggestedQuantity: pattern.usualQuantity,
    suggestedUnit: pattern.usualUnit,
    actionLabel: isDue ? "Add to list" : "Add staple",
    source: "saved-pattern",
    isFallback: false
  };
}

function preferenceFromPattern(pattern: RecurringPatternInput): MemorySuggestion {
  return {
    id: `preference-pattern-${pattern.groceryItem.canonicalName}`,
    type: "PREFERENCE",
    canonicalName: pattern.groceryItem.canonicalName,
    displayName: pattern.groceryItem.displayName,
    category: pattern.groceryItem.category,
    reason: `${pattern.preferredBrand} is saved as the preferred brand for ${pattern.groceryItem.displayName}.`,
    confidence: pattern.confidenceScore,
    lastSeenAt: pattern.lastOrderedAt,
    suggestedQuantity: pattern.usualQuantity,
    suggestedUnit: pattern.usualUnit,
    actionLabel: "Use preference",
    source: "saved-pattern",
    isFallback: false
  };
}

function preferenceFromSavedPreference(preference: GroceryPreferenceInput): MemorySuggestion {
  return {
    id: `preference-saved-${preference.groceryItem.canonicalName}`,
    type: "PREFERENCE",
    canonicalName: preference.groceryItem.canonicalName,
    displayName: preference.groceryItem.displayName,
    category: preference.groceryItem.category,
    reason: `${preference.groceryItem.displayName} has a saved preference${preference.preferredBrand ? ` for ${preference.preferredBrand}` : ""}.`,
    confidence: 0.7,
    lastSeenAt: null,
    suggestedQuantity: preference.preferredQuantity,
    suggestedUnit: preference.preferredUnit,
    actionLabel: "Use preference",
    source: "saved-pattern",
    isFallback: false
  };
}

function buildSetupSuggestions(): MemorySuggestion[] {
  return groceryCatalogSeeds
    .filter((item) => setupSuggestionNames.includes(item.canonicalName))
    .map((item) => ({
      id: `setup-${item.canonicalName}`,
      type: item.canonicalName === "atta" || item.canonicalName === "oil" ? "MONTHLY_STAPLE" : "FREQUENT_ITEM",
      canonicalName: item.canonicalName,
      displayName: item.displayName,
      category: item.category,
      reason: `Setup suggestion: ${item.displayName} is a common household item. Add it once to help HomeStock learn your actual pattern.`,
      confidence: 0.35,
      lastSeenAt: null,
      suggestedQuantity: defaultQuantityFor(item.canonicalName),
      suggestedUnit: item.defaultUnit,
      actionLabel: "Add setup item",
      source: "setup",
      isFallback: true
    }));
}

function defaultQuantityFor(canonicalName: string) {
  if (canonicalName === "atta") return 5;
  if (canonicalName === "oil") return 1;
  if (canonicalName === "milk") return 1;
  if (canonicalName === "eggs") return 30;
  return null;
}

function groupEvents(events: MemoryHistoryEvent[]) {
  const grouped = new Map<string, MemoryHistoryEvent[]>();
  for (const event of events) {
    grouped.set(event.canonicalName, [...(grouped.get(event.canonicalName) ?? []), event]);
  }
  return grouped;
}

function calculateIntervals(dates: Date[]) {
  const uniqueDays = Array.from(new Set(dates.map((date) => startOfDay(date).getTime()))).sort((a, b) => a - b);
  const intervals: number[] = [];
  for (let index = 1; index < uniqueDays.length; index += 1) {
    const interval = Math.round((uniqueDays[index] - uniqueDays[index - 1]) / dayMs);
    if (interval > 0) intervals.push(interval);
  }
  return intervals;
}

function mostUsefulQuantity(events: MemoryHistoryEvent[]) {
  const quantities = events.map((event) => event.quantity).filter((quantity): quantity is number => typeof quantity === "number" && quantity > 0);
  return quantities.length ? median(quantities) : null;
}

function mostCommon(values: string[]) {
  if (!values.length) return null;
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[midpoint] : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
}

const dayMs = 24 * 60 * 60 * 1000;

function daysBetween(start: Date, end: Date) {
  return Math.max(0, Math.floor((startOfDay(end).getTime() - startOfDay(start).getTime()) / dayMs));
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function confidenceFor(eventCount: number, intervalCount: number) {
  if (eventCount < 2) return 0.45;
  return Math.min(0.9, 0.55 + intervalCount * 0.12 + Math.max(0, eventCount - 2) * 0.04);
}

function formatInterval(days: number) {
  if (days <= 1) return "1 day";
  if (days <= 3) return "2-3 days";
  if (days >= 27 && days <= 33) return "about monthly";
  return `${Math.round(days)} days`;
}

function formatDaysAgo(days: number) {
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function formatQuantity(quantity: number, unit: string | null) {
  return [Number.isInteger(quantity) ? quantity.toFixed(0) : String(quantity), unit].filter(Boolean).join(" ");
}

function dedupeSuggestions(suggestions: MemorySuggestion[]) {
  const byKey = new Map<string, MemorySuggestion>();
  for (const suggestion of suggestions) {
    const key = `${suggestion.type}:${suggestion.canonicalName}`;
    const existing = byKey.get(key);
    if (!existing || suggestion.confidence > existing.confidence) byKey.set(key, suggestion);
  }
  return [...byKey.values()];
}

function sortByConfidence(a: MemorySuggestion, b: MemorySuggestion) {
  return b.confidence - a.confidence || a.displayName.localeCompare(b.displayName);
}
