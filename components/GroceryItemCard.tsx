import type { GroceryRequest } from "@prisma/client";
import { AdminApprovalPanel } from "./AdminApprovalPanel";

export function GroceryItemCard({ request, actorId }: { request: GroceryRequest; actorId: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink">{request.displayName}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {request.quantity ?? "Qty not set"}
            {request.unit ? ` ${request.unit}` : ""} · {request.urgency.toLowerCase()} urgency
          </p>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{request.status.replaceAll("_", " ")}</span>
      </div>
      {request.notes ? <p className="mt-3 text-sm text-slate-600">{request.notes}</p> : null}
      <p className="mt-3 text-xs text-slate-500">Raw: {request.rawText.split("\n").at(-1)}</p>
      <div className="mt-4">
        <AdminApprovalPanel requestId={request.id} actorId={actorId} />
      </div>
    </article>
  );
}
