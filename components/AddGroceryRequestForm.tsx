"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { ParsedGroceryItem, parseGroceryText } from "@/lib/grocery/parser";
import { ParsedItemsPreview } from "./ParsedItemsPreview";
import { StatusPill } from "./StatusPill";

type ExistingRequest = {
  id: string;
  canonicalName: string;
  displayName: string;
  status: string;
};

type EditableParsedItem = ParsedGroceryItem & {
  localId: string;
};

const defaultPrompt = "Need 2 kg atta, 1 litre oil, tomatoes and coriander";

export function AddGroceryRequestForm({
  householdId,
  actorId,
  cookActorId,
  existingRequests
}: {
  householdId: string;
  actorId: string;
  cookActorId?: string;
  existingRequests: ExistingRequest[];
}) {
  const [rawText, setRawText] = useState(defaultPrompt);
  const [urgency, setUrgency] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [notes, setNotes] = useState("");
  const [requestActorId, setRequestActorId] = useState(actorId);
  const [cookMode, setCookMode] = useState(false);
  const [items, setItems] = useState<EditableParsedItem[]>(() => withLocalIds(parseGroceryText(defaultPrompt)));

  const duplicateHints = useMemo(() => {
    return items.flatMap((item) => {
      const match = existingRequests.find((request) => request.canonicalName === item.canonicalName && request.status !== "REJECTED");
      return match ? [{ incoming: item.displayName, existing: match.displayName, status: match.status }] : [];
    });
  }, [existingRequests, items]);

  function parseRequest() {
    setItems(withLocalIds(parseGroceryText(rawText)));
  }

  function updateItem(localId: string, patch: Partial<EditableParsedItem>) {
    setItems((current) => current.map((item) => (item.localId === localId ? { ...item, ...patch } : item)));
  }

  async function submit() {
    const requestText = items.length ? serializeItems(items) : rawText;
    await fetch(`/api/households/${householdId}/grocery-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawText: requestText,
        urgency,
        notes,
        requestedBy: requestActorId
      })
    });
    window.location.href = `/grocery?householdId=${householdId}`;
  }

  function applyChip(chip: string) {
    if (chip === "From cook" && cookActorId) {
      setRequestActorId(cookActorId);
      setCookMode(true);
    }
    if (chip === "Urgent") setUrgency("HIGH");
    if (chip === "For today") setNotes((current) => mergeNote(current, "For today"));
    if (chip === "Monthly stock") setNotes((current) => mergeNote(current, "Monthly stock"));
  }

  return (
    <section className="grid gap-5 rounded-[1.5rem] border border-cocoa/10 bg-paper p-5 shadow-editorial">
      <div className="grid gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-bark">Natural language request</p>
        <textarea
          className="min-h-36 rounded-lg border border-cocoa/15 bg-cream px-4 py-3 text-lg leading-7 text-cocoa outline-none focus:border-forest"
          aria-label="Natural language grocery request"
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          placeholder="Tell HomeStock what needs ordering"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {["From cook", "Urgent", "For today", "Monthly stock"].map((chip) => (
          <button
            type="button"
            key={chip}
            className="rounded-full border border-cocoa/15 bg-cream px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cocoa hover:bg-peach/50"
            onClick={() => applyChip(chip)}
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="grid gap-3 rounded-lg border border-forest/15 bg-sage p-4 text-forest">
        <label className="flex items-start gap-3">
          <input className="mt-1" type="checkbox" checked={cookMode} onChange={(event) => setCookMode(event.target.checked)} />
          <span>
            <span className="block font-semibold">Cook/helper mode</span>
            <span className="text-sm text-forest/75">Keeps the input simple and treats the note as a household request for admin review.</span>
          </span>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="grid gap-1 text-sm">
          <span className="font-bold uppercase tracking-[0.16em] text-bark">Notes</span>
          <input className="rounded-md border border-cocoa/15 bg-cream px-3 py-2 text-cocoa" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <button type="button" className="inline-flex items-center justify-center gap-2 rounded-md bg-cocoa px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-paper hover:bg-forest" onClick={parseRequest}>
          <Sparkles className="h-4 w-4" />
          Parse request
        </button>
      </div>

      <ParsedItemsPreview items={items} />

      <div className="grid gap-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-editorial text-3xl font-semibold text-forest">Editable parsed items</h2>
          <StatusPill tone="neutral">{items.length} parsed</StatusPill>
        </div>
        {items.map((item) => (
          <div key={item.localId} className="grid gap-2 rounded-lg border border-cocoa/10 bg-cream p-3 md:grid-cols-[1fr_120px_140px]">
            <input
              className="rounded-md border border-cocoa/10 bg-paper px-3 py-2 text-cocoa"
              value={item.displayName}
              onChange={(event) => updateItem(item.localId, { displayName: event.target.value, name: event.target.value })}
            />
            <input
              className="rounded-md border border-cocoa/10 bg-paper px-3 py-2 text-cocoa"
              type="number"
              placeholder="Qty"
              value={item.quantity ?? ""}
              onChange={(event) => updateItem(item.localId, { quantity: event.target.value ? Number(event.target.value) : null })}
            />
            <input
              className="rounded-md border border-cocoa/10 bg-paper px-3 py-2 text-cocoa"
              placeholder="Unit"
              value={item.unit ?? ""}
              onChange={(event) => updateItem(item.localId, { unit: event.target.value || null })}
            />
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-peachDeep/30 bg-peach/45 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="cart">Duplicate detection</StatusPill>
          <p className="font-semibold text-cocoa">
            {duplicateHints[0] ? `${duplicateHints[0].incoming} and ${duplicateHints[0].existing} look similar. Merge?` : "Dahi and curd look similar. Merge?"}
          </p>
        </div>
        <p className="mt-2 text-sm text-bark">
          {duplicateHints.length ? "Matched against active household requests." : "Example hint shown until this request matches an existing household item."}
        </p>
      </div>

      <button type="button" className="inline-flex items-center justify-center gap-2 rounded-md bg-forest px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-paper hover:bg-cocoa" onClick={submit}>
        Add to pending list
        <ArrowRight className="h-4 w-4" />
      </button>
    </section>
  );
}

function withLocalIds(items: ParsedGroceryItem[]): EditableParsedItem[] {
  return items.map((item, index) => ({ ...item, localId: `${item.canonicalName}-${index}` }));
}

function serializeItems(items: EditableParsedItem[]) {
  return items
    .map((item) => [item.quantity, item.unit, item.displayName].filter(Boolean).join(" "))
    .join(", ");
}

function mergeNote(current: string, next: string) {
  if (!current) return next;
  if (current.includes(next)) return current;
  return `${current}; ${next}`;
}
