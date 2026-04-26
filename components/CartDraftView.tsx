import type { CartDraft, CartItem } from "@prisma/client";
import { CartApprovalPanel } from "./CartApprovalPanel";

type CartWithItems = CartDraft & {
  items: CartItem[];
};

export function CartDraftView({ cart, actorId }: { cart: CartWithItems; actorId: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Cart draft</h2>
          <p className="text-sm text-slate-600">
            {cart.provider.replace("_", " ")} · {cart.status.replaceAll("_", " ")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Estimated total</p>
          <p className="text-2xl font-semibold text-ink">₹{cart.estimatedTotal.toFixed(0)}</p>
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Brand</th>
              <th className="px-3 py-2">Unit</th>
              <th className="px-3 py-2">Availability</th>
              <th className="px-3 py-2 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {cart.items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{item.productName}</td>
                <td className="px-3 py-2">{item.brand}</td>
                <td className="px-3 py-2">{item.unit}</td>
                <td className="px-3 py-2">
                  {item.availabilityStatus}
                  {item.substitutionReason ? <span className="block text-xs text-mango">{item.substitutionReason}</span> : null}
                </td>
                <td className="px-3 py-2 text-right">₹{item.price.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">This is a mock cart. No checkout or order placement will happen.</p>
        <CartApprovalPanel cartId={cart.id} actorId={actorId} disabled={cart.status === "APPROVED"} />
      </div>
    </article>
  );
}
