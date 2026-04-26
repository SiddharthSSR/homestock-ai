import type { GroceryRequest } from "@prisma/client";
import { AdminApprovalPanel } from "./AdminApprovalPanel";
import { StatusPill, statusTone } from "./StatusPill";

export function GroceryItemCard({ request, actorId }: { request: GroceryRequest; actorId: string }) {
  return (
    <article className="rounded-lg border border-cocoa/10 bg-paper p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-bark">{request.category}</p>
          <h3 className="mt-2 text-xl font-semibold text-cocoa">{request.displayName}</h3>
          <p className="mt-1 text-sm text-bark">
            {request.quantity ?? "Qty not set"}
            {request.unit ? ` ${request.unit}` : ""} · {request.urgency.toLowerCase()} urgency
          </p>
        </div>
        <StatusPill tone={statusTone(request.status)}>{request.status.replaceAll("_", " ")}</StatusPill>
      </div>
      {request.notes ? <p className="mt-4 rounded-md bg-cream px-3 py-2 text-sm text-bark">{request.notes}</p> : null}
      <p className="mt-3 text-xs text-bark/75">Raw: {request.rawText.split("\n").at(-1)}</p>
      <div className="mt-4">
        <AdminApprovalPanel requestId={request.id} actorId={actorId} />
      </div>
    </article>
  );
}
