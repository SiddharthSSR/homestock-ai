import type { ParsedGroceryItem } from "@/lib/grocery/parser";

export function ParsedItemsPreview({ items }: { items: ParsedGroceryItem[] }) {
  if (!items.length) return null;

  return (
    <div className="rounded-lg border border-cocoa/10 bg-cream p-3">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-bark">Parsed preview</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item.canonicalName} className="rounded-md border border-cocoa/10 bg-paper px-2 py-1 text-xs font-medium text-cocoa">
            {item.displayName}
            {item.quantity ? ` · ${item.quantity}` : ""}
            {item.unit ? ` ${item.unit}` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
