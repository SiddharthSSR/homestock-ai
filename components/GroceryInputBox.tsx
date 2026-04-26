"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { parseGroceryText } from "@/lib/grocery/parser";
import { ParsedItemsPreview } from "./ParsedItemsPreview";

export function GroceryInputBox({ householdId, actorId }: { householdId: string; actorId: string }) {
  const [rawText, setRawText] = useState("Need 2 kg atta, 1 litre oil, tomatoes and coriander");
  const [urgency, setUrgency] = useState("MEDIUM");
  const [notes, setNotes] = useState("");
  const parsed = useMemo(() => parseGroceryText(rawText), [rawText]);

  async function submit() {
    await fetch(`/api/households/${householdId}/grocery-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText, urgency, notes, requestedBy: actorId })
    });
    window.location.reload();
  }

  return (
    <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div>
        <h2 className="text-lg font-semibold text-ink">Add grocery request</h2>
        <p className="text-sm text-slate-600">Use simple English, Hindi, or Hinglish terms. Duplicates are merged when safe.</p>
      </div>
      <textarea
        className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
        value={rawText}
        onChange={(event) => setRawText(event.target.value)}
      />
      <div className="grid gap-3 md:grid-cols-[180px_1fr]">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">Urgency</span>
          <select className="rounded-md border border-slate-300 bg-white px-3 py-2" value={urgency} onChange={(event) => setUrgency(event.target.value)}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">Notes</span>
          <input className="rounded-md border border-slate-300 px-3 py-2" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
      </div>
      <ParsedItemsPreview items={parsed} />
      <button className="inline-flex w-fit items-center gap-2 rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white hover:bg-green-700" onClick={submit}>
        <Plus className="h-4 w-4" />
        Add to pending list
      </button>
    </section>
  );
}
