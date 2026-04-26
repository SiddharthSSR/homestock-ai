import type { ParsedGroceryItem } from "@/lib/grocery/parser";

export function ParsedItemsPreview({ items }: { items: ParsedGroceryItem[] }) {
  if (!items.length) return null;

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-medium text-slate-700">Parsed preview</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item.canonicalName} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
            {item.displayName}
            {item.quantity ? ` · ${item.quantity}` : ""}
            {item.unit ? ` ${item.unit}` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
