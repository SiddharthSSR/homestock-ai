"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { ParsedGroceryItem, parseGroceryText } from "@/lib/grocery/parser";
import { serializeGroceryItems } from "@/lib/grocery/serialize";
import { normalizeGroceryName } from "@/lib/grocery/synonyms";
import { ParsedItemsPreview } from "./ParsedItemsPreview";
import { StatusPill } from "./StatusPill";

type ExistingRequest = {
  id: string;
  canonicalName: string;
  displayName: string;
  unit: string | null;
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
  const [rawText, setRawText] = useState("");
  const [urgency, setUrgency] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [notes, setNotes] = useState("");
  const [requestActorId, setRequestActorId] = useState(actorId);
  const [cookMode, setCookMode] = useState(false);
  const [items, setItems] = useState<EditableParsedItem[]>([]);
  const [parseAttempted, setParseAttempted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duplicateHints = useMemo(() => {
    return items.flatMap((item) => {
      const match = existingRequests.find((request) => request.canonicalName === item.canonicalName && request.status === "PENDING" && quantitiesAreMergeable(request.unit, item.unit));
      return match ? [{ incoming: item.displayName, existing: match.displayName, status: match.status }] : [];
    });
  }, [existingRequests, items]);

  function parseRequest() {
    setError(null);
    setParseAttempted(true);

    if (!rawText.trim()) {
      setItems([]);
      setError("Enter a grocery request before parsing.");
      return;
    }

    const parsedItems = withLocalIds(parseGroceryText(rawText));
    setItems(parsedItems);

    if (!parsedItems.length) {
      setError("HomeStock could not find grocery items in that note. Try a simpler request.");
    }
  }

  function updateItem(localId: string, patch: Partial<EditableParsedItem>) {
    setItems((current) => current.map((item) => (item.localId === localId ? { ...item, ...patch } : item)));
  }

  function updateItemName(localId: string, value: string) {
    const normalized = normalizeGroceryName(value);
    updateItem(localId, {
      name: value,
      displayName: value,
      canonicalName: normalized.canonicalName,
      category: normalized.category,
      confidence: normalized.confidence
    });
  }

  async function submit() {
    setError(null);

    if (!items.length) {
      setError("Parse and review at least one grocery item before saving.");
      return;
    }

    if (items.some((item) => !item.displayName.trim())) {
      setError("Every parsed item needs an item name before saving.");
      return;
    }

    const requestText = items.length ? serializeGroceryItems(items) : rawText;
    setIsSaving(true);

    try {
      const response = await fetch(`/api/households/${householdId}/grocery-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: requestText,
          urgency,
          notes,
          requestedBy: requestActorId
        })
      });

      if (!response.ok) {
        throw new Error("Could not save grocery requests.");
      }

      window.location.href = `/grocery?householdId=${householdId}`;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save grocery requests.");
      setIsSaving(false);
    }
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
          onChange={(event) => {
            setRawText(event.target.value);
            setError(null);
          }}
          placeholder={defaultPrompt}
        />
        <p className="text-sm text-bark">Example: {defaultPrompt}</p>
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
          <input
            className="mt-1"
            type="checkbox"
            checked={cookMode}
            onChange={(event) => {
              setCookMode(event.target.checked);
              setRequestActorId(event.target.checked && cookActorId ? cookActorId : actorId);
            }}
          />
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
      {parseAttempted && !items.length && !error ? <p className="rounded-lg border border-dashed border-cocoa/15 bg-cream p-4 text-sm text-bark">Parsed items will appear here before saving.</p> : null}

      <div className="grid gap-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-editorial text-3xl font-semibold text-forest">Editable parsed items</h2>
          <StatusPill tone="neutral">{items.length} parsed</StatusPill>
        </div>
        {items.map((item) => (
          <div key={item.localId} className="grid gap-2 rounded-lg border border-cocoa/10 bg-cream p-3 md:grid-cols-[1fr_120px_140px]">
            <input
              className="rounded-md border border-cocoa/10 bg-paper px-3 py-2 text-cocoa"
              aria-label={`${item.displayName} item name`}
              value={item.displayName}
              onChange={(event) => updateItemName(item.localId, event.target.value)}
            />
            <input
              className="rounded-md border border-cocoa/10 bg-paper px-3 py-2 text-cocoa"
              type="number"
              min="0"
              step="0.25"
              aria-label={`${item.displayName} quantity`}
              placeholder="Qty"
              value={item.quantity ?? ""}
              onChange={(event) => updateItem(item.localId, { quantity: event.target.value ? Number(event.target.value) : null })}
            />
            <input
              className="rounded-md border border-cocoa/10 bg-paper px-3 py-2 text-cocoa"
              aria-label={`${item.displayName} unit`}
              placeholder="Unit"
              value={item.unit ?? ""}
              onChange={(event) => updateItem(item.localId, { unit: event.target.value || null })}
            />
            <p className="text-xs text-bark md:col-span-3">
              Canonical: <span className="font-semibold text-cocoa">{item.canonicalName}</span> · Category: <span className="font-semibold text-cocoa">{item.category}</span> · Confidence:{" "}
              <span className="font-semibold text-cocoa">{Math.round(item.confidence * 100)}%</span>
            </p>
          </div>
        ))}
      </div>

      {duplicateHints.length ? (
        <div className="rounded-lg border border-peachDeep/30 bg-peach/45 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="cart">Duplicate detection</StatusPill>
            <p className="font-semibold text-cocoa">{duplicateHints[0].incoming} and {duplicateHints[0].existing} look similar. HomeStock may merge compatible pending quantities.</p>
          </div>
          <p className="mt-2 text-sm text-bark">Matched against active household requests.</p>
        </div>
      ) : null}

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <button
        type="button"
        disabled={isSaving || !items.length}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-forest px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-paper hover:bg-cocoa disabled:cursor-not-allowed disabled:bg-bark/30"
        onClick={submit}
      >
        {isSaving ? "Saving..." : "Add to pending list"}
        <ArrowRight className="h-4 w-4" />
      </button>
    </section>
  );
}

function withLocalIds(items: ParsedGroceryItem[]): EditableParsedItem[] {
  return items.map((item, index) => ({ ...item, localId: `${item.canonicalName}-${index}` }));
}

function mergeNote(current: string, next: string) {
  if (!current) return next;
  if (current.includes(next)) return current;
  return `${current}; ${next}`;
}

function quantitiesAreMergeable(existingUnit: string | null, incomingUnit: string | null) {
  return existingUnit === incomingUnit || existingUnit === null || incomingUnit === null;
}
