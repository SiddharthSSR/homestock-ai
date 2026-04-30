import { normalizeGroceryName } from "./synonyms";

export type ParsedGroceryItem = {
  name: string;
  canonicalName: string;
  displayName: string;
  quantity: number | null;
  unit: string | null;
  category: string;
  confidence: number;
};

const units = [
  "kg",
  "kilogram",
  "kilograms",
  "g",
  "gram",
  "grams",
  "litre",
  "liter",
  "litres",
  "liters",
  "l",
  "ml",
  "packet",
  "packets",
  "pack",
  "bunch",
  "bunches",
  "piece",
  "pieces",
  "dozen"
];

const unitAliases = new Map([
  ["kilogram", "kg"],
  ["kilograms", "kg"],
  ["gram", "g"],
  ["grams", "g"],
  ["liter", "litre"],
  ["liters", "litre"],
  ["litres", "litre"],
  ["l", "litre"],
  ["packets", "packet"],
  ["packs", "packet"],
  ["pack", "packet"],
  ["bunches", "bunch"],
  ["pieces", "piece"]
]);

const quantityWords = new Map([
  ["one", 1],
  ["two", 2],
  ["three", 3],
  ["four", 4],
  ["five", 5],
  ["six", 6],
  ["seven", 7],
  ["eight", 8],
  ["nine", 9],
  ["ten", 10]
]);

export function parseGroceryText(input: string): ParsedGroceryItem[] {
  const normalizedInput = input
    .toLowerCase()
    .replace(/\+/g, " and ")
    .replace(/\b&\b/g, " and ")
    .replace(/[;।]/g, ",")
    .replace(/\b(and|aur)\b/g, ",")
    .replace(/\s+/g, " ")
    .trim();

  const parts = normalizedInput
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const parsed = parts
    .map(parsePart)
    .filter((item): item is ParsedGroceryItem => item !== null);

  return dedupeParsedItems(parsed);
}

function parsePart(part: string): ParsedGroceryItem | null {
  let working = part
    .replace(/\b(khatam ho raha hai|khatam ho rahi hai|khatam ho raha|khatam ho rahi)\b/g, " ")
    .replace(/\b(need|needs|please|pls|order|buy|bring|get|add|some|required|require|chahiye|chaiye)\b/g, " ")
    .replace(/\b(for today|for tomorrow|today|tomorrow|tonight|this evening|for evening|for dinner|for lunch|for breakfast)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!working) return null;

  const quantityPattern = new RegExp(`\\b(\\d+(?:\\.\\d+)?|${Array.from(quantityWords.keys()).join("|")})\\s*(${units.join("|")})?\\b`, "i");
  const match = working.match(quantityPattern);
  let quantity: number | null = null;
  let unit: string | null = null;

  if (match) {
    quantity = toQuantity(match[1]);
    unit = normalizeUnit(match[2] ?? null);
    working = working.replace(match[0], " ").replace(/\s+/g, " ").trim();
  }

  const normalized = normalizeGroceryName(working);
  if (!normalized.canonicalName) return null;

  return {
    name: working,
    canonicalName: normalized.canonicalName,
    displayName: normalized.displayName,
    quantity,
    unit: unit ?? normalized.defaultUnit,
    category: normalized.category,
    confidence: normalized.confidence
  };
}

function dedupeParsedItems(items: ParsedGroceryItem[]) {
  const merged = new Map<string, ParsedGroceryItem>();

  for (const item of items) {
    const existing = merged.get(item.canonicalName);
    if (!existing) {
      merged.set(item.canonicalName, item);
      continue;
    }

    const unitsCompatible = existing.unit === item.unit || !existing.unit || !item.unit;
    if (unitsCompatible && existing.quantity !== null && item.quantity !== null) {
      existing.quantity += item.quantity;
      existing.unit = existing.unit ?? item.unit;
    }
  }

  return Array.from(merged.values());
}

function toQuantity(value: string) {
  const word = quantityWords.get(value.toLowerCase());
  if (word) return word;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeUnit(unit: string | null) {
  if (!unit) return null;
  return unitAliases.get(unit.toLowerCase()) ?? unit.toLowerCase();
}
