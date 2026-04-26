export type GroceryCatalogSeed = {
  canonicalName: string;
  displayName: string;
  category: string;
  defaultUnit: string | null;
  synonyms: string[];
};

export const groceryCatalogSeeds: GroceryCatalogSeed[] = [
  { canonicalName: "atta", displayName: "Atta", category: "Staples", defaultUnit: "kg", synonyms: ["aata", "flour", "wheat flour"] },
  { canonicalName: "curd", displayName: "Curd", category: "Dairy", defaultUnit: "g", synonyms: ["dahi", "yogurt", "yoghurt"] },
  { canonicalName: "coriander", displayName: "Coriander", category: "Vegetables", defaultUnit: "bunch", synonyms: ["dhaniya", "cilantro"] },
  { canonicalName: "tomato", displayName: "Tomato", category: "Vegetables", defaultUnit: "kg", synonyms: ["tamatar", "tomatoes"] },
  { canonicalName: "onion", displayName: "Onion", category: "Vegetables", defaultUnit: "kg", synonyms: ["pyaaz", "pyaz", "onions"] },
  { canonicalName: "potato", displayName: "Potato", category: "Vegetables", defaultUnit: "kg", synonyms: ["aloo", "aaloo", "potatoes"] },
  { canonicalName: "milk", displayName: "Milk", category: "Dairy", defaultUnit: "litre", synonyms: ["doodh"] },
  { canonicalName: "rice", displayName: "Rice", category: "Staples", defaultUnit: "kg", synonyms: ["chawal"] },
  { canonicalName: "oil", displayName: "Cooking Oil", category: "Cooking", defaultUnit: "litre", synonyms: ["tel", "cooking oil"] },
  { canonicalName: "chilli", displayName: "Chilli", category: "Vegetables", defaultUnit: "g", synonyms: ["mirchi", "chili", "green chilli"] },
  { canonicalName: "turmeric", displayName: "Turmeric", category: "Spices", defaultUnit: "g", synonyms: ["haldi"] },
  { canonicalName: "cumin", displayName: "Cumin", category: "Spices", defaultUnit: "g", synonyms: ["jeera"] },
  { canonicalName: "salt", displayName: "Salt", category: "Staples", defaultUnit: "kg", synonyms: ["namak"] },
  { canonicalName: "sugar", displayName: "Sugar", category: "Staples", defaultUnit: "kg", synonyms: ["chini"] },
  { canonicalName: "eggs", displayName: "Eggs", category: "Protein", defaultUnit: "piece", synonyms: ["egg", "anda", "ande"] }
];

export const grocerySynonymSeeds = groceryCatalogSeeds.flatMap((item) => [
  { canonicalName: item.canonicalName, synonym: item.canonicalName, language: "en" },
  ...item.synonyms.map((synonym) => ({
    canonicalName: item.canonicalName,
    synonym,
    language: /dahi|dhaniya|tamatar|pyaaz|pyaz|aloo|aaloo|doodh|chawal|tel|mirchi|haldi|jeera|namak|chini|anda|ande/.test(synonym)
      ? "hi-Latn"
      : "en"
  }))
]);

const synonymMap = new Map<string, GroceryCatalogSeed>();

for (const item of groceryCatalogSeeds) {
  synonymMap.set(item.canonicalName, item);
  synonymMap.set(item.displayName.toLowerCase(), item);
  for (const synonym of item.synonyms) {
    synonymMap.set(synonym.toLowerCase(), item);
  }
}

export function normalizeGroceryName(rawName: string) {
  const cleaned = cleanItemName(rawName);
  const direct = synonymMap.get(cleaned);

  if (direct) {
    return {
      canonicalName: direct.canonicalName,
      displayName: direct.displayName,
      category: direct.category,
      defaultUnit: direct.defaultUnit,
      confidence: direct.canonicalName === cleaned ? 1 : 0.95
    };
  }

  const singular = singularize(cleaned);
  const singularMatch = synonymMap.get(singular);

  if (singularMatch) {
    return {
      canonicalName: singularMatch.canonicalName,
      displayName: singularMatch.displayName,
      category: singularMatch.category,
      defaultUnit: singularMatch.defaultUnit,
      confidence: 0.9
    };
  }

  return {
    canonicalName: singular,
    displayName: titleCase(singular),
    category: inferCategory(singular),
    defaultUnit: null,
    confidence: 0.55
  };
}

export function cleanItemName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\b(khatam|ho|raha|rahi|hai|hain|please|pls|need|needs|order|buy|bring|required|require|add|some)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function singularize(value: string) {
  if (value.endsWith("ies")) return `${value.slice(0, -3)}y`;
  if (value.endsWith("oes")) return value.slice(0, -2);
  if (value.endsWith("s") && !value.endsWith("ss") && value !== "eggs") return value.slice(0, -1);
  return value;
}

function inferCategory(value: string) {
  if (/(milk|curd|paneer|cheese|butter|cream)/.test(value)) return "Dairy";
  if (/(tomato|onion|potato|coriander|chilli|vegetable|palak|beans|carrot)/.test(value)) return "Vegetables";
  if (/(atta|rice|dal|salt|sugar|flour|poha|suji)/.test(value)) return "Staples";
  if (/(oil|ghee)/.test(value)) return "Cooking";
  if (/(haldi|turmeric|jeera|cumin|masala|pepper)/.test(value)) return "Spices";
  if (/(egg|chicken|fish|paneer)/.test(value)) return "Protein";
  return "Other";
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
