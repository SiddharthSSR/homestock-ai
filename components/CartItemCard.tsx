import type { CartItem } from "@prisma/client";
import { StatusPill } from "./StatusPill";

export function CartItemCard({ item }: { item: CartItem }) {
  return (
    <article className="rounded-lg border border-cocoa/10 bg-paper p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-cocoa">{item.productName}</h3>
          <p className="mt-1 text-sm text-bark">
            {item.brand ?? "Mock Essentials"} · {item.unit ?? "Unit not set"}
          </p>
        </div>
        <StatusPill tone={item.availabilityStatus === "AVAILABLE" ? "approved" : item.availabilityStatus === "SUBSTITUTED" ? "cart" : "pending"}>
          {item.availabilityStatus}
        </StatusPill>
      </div>
      {item.substitutionReason ? <p className="mt-3 rounded-md bg-peach/35 px-3 py-2 text-sm text-cocoa">{item.substitutionReason}</p> : null}
      <p className="font-editorial mt-4 text-3xl text-cocoa">₹{item.price.toFixed(0)}</p>
    </article>
  );
}
