export type SerializableGroceryItem = {
  displayName: string;
  quantity?: number | null;
  unit?: string | null;
};

export function serializeGroceryItems(items: SerializableGroceryItem[]) {
  return items.map(serializeGroceryItem).filter(Boolean).join(", ");
}

function serializeGroceryItem(item: SerializableGroceryItem) {
  const displayName = item.displayName.trim();
  if (!displayName) return "";

  if (item.quantity === null || item.quantity === undefined || item.quantity === 0) {
    return displayName;
  }

  return [formatQuantity(item.quantity), item.unit?.trim(), displayName].filter(Boolean).join(" ");
}

function formatQuantity(quantity: number) {
  return Number.isInteger(quantity) ? String(quantity) : String(quantity);
}
