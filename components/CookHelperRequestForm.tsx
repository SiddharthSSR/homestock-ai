"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Trash2 } from "lucide-react";
import { buildCookHelperNotes } from "@/lib/cook-helper-mode";
import { ParsedGroceryItem, parseGroceryText } from "@/lib/grocery/parser";
import { serializeGroceryItems } from "@/lib/grocery/serialize";
import { normalizeGroceryName } from "@/lib/grocery/synonyms";
import { hrefWithPreservedParams } from "@/lib/navigation";
import { StatusPill, statusTone } from "./StatusPill";

type ExistingRequest = {
  id: string;
  canonicalName: string;
  displayName: string;
  unit: string | null;
  status: string;
};

type SubmittedRequest = {
  id: string;
  displayName: string;
  status: string;
  createdAtLabel: string;
};

type EditableParsedItem = ParsedGroceryItem & {
  localId: string;
};

const examples = ["Aata, tamatar, pyaaz, tel, dhaniya chahiye", "Doodh 2 litre, dahi, aloo 1 kg"];

export function CookHelperRequestForm({
  householdId,
  actorId,
  existingRequests,
  submittedRequests
}: {
  householdId: string;
  actorId: string;
  existingRequests: ExistingRequest[];
  submittedRequests: SubmittedRequest[];
}) {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [urgency, setUrgency] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<EditableParsedItem[]>([]);
  const [reviewed, setReviewed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duplicateHint = useMemo(() => {
    return items.find((item) => existingRequests.some((request) => request.canonicalName === item.canonicalName && request.status === "PENDING" && quantitiesAreMergeable(request.unit, item.unit)));
  }, [existingRequests, items]);

  function reviewItems() {
    setError(null);

    if (!rawText.trim()) {
      setItems([]);
      setReviewed(false);
      setError("Please tell HomeStock what is needed.");
      return;
    }

    const parsedItems = withLocalIds(parseGroceryText(rawText));
    setItems(parsedItems);
    setReviewed(true);

    if (!parsedItems.length) {
      setError("HomeStock could not find grocery items in that note. Try a simple list like doodh, dahi, aloo.");
    }
  }

  function updateItemName(localId: string, value: string) {
    const normalized = normalizeGroceryName(value);
    setItems((current) =>
      current.map((item) =>
        item.localId === localId
          ? {
              ...item,
              name: value,
              displayName: value,
              canonicalName: normalized.canonicalName,
              category: normalized.category,
              confidence: normalized.confidence
            }
          : item
      )
    );
  }

  function removeItem(localId: string) {
    setItems((current) => current.filter((item) => item.localId !== localId));
  }

  function applyChip(chip: string) {
    if (chip === "Urgent") {
      setUrgency("HIGH");
      return;
    }

    setNotes((current) => mergeNote(current, chip));
  }

  async function submit() {
    setError(null);

    if (!items.length) {
      reviewItems();
      return;
    }

    if (items.some((item) => !item.displayName.trim())) {
      setError("Please keep a name for every item before sending.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/households/${householdId}/grocery-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: serializeGroceryItems(items),
          urgency,
          notes: buildCookHelperNotes(notes),
          requestedBy: actorId
        })
      });

      if (!response.ok) {
        throw new Error("Could not send this request.");
      }

      router.replace(hrefWithPreservedParams("/grocery", { householdId, actorId }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send this request.");
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-5 rounded-[1.5rem] border border-cocoa/10 bg-paper p-5 shadow-editorial">
        <div className="grid gap-2">
          <StatusPill tone="approved">Cook helper mode</StatusPill>
          <h2 className="font-editorial text-4xl font-semibold leading-none text-forest">Tell HomeStock what is needed.</h2>
          <p className="text-base leading-7 text-bark">We&apos;ll organize the list for the household. Your grocery request will be sent to the household for approval.</p>
        </div>

        <div className="grid gap-3">
          <textarea
            className="min-h-44 rounded-2xl border border-cocoa/15 bg-cream px-4 py-4 text-xl leading-8 text-cocoa outline-none focus:border-forest"
            aria-label="Cook grocery request"
            value={rawText}
            onChange={(event) => {
              setRawText(event.target.value);
              setError(null);
              setReviewed(false);
            }}
            placeholder={examples[0]}
          />
          <div className="grid gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-bark">Examples</p>
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                className="rounded-xl border border-cocoa/10 bg-cream px-4 py-3 text-left text-sm font-semibold text-cocoa"
                onClick={() => {
                  setRawText(example);
                  setError(null);
                  setReviewed(false);
                }}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {["Khatam ho raha hai", "Aaj ke liye", "Urgent", "Monthly stock"].map((chip) => (
            <button
              type="button"
              key={chip}
              className="min-h-11 rounded-full border border-cocoa/15 bg-cream px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-cocoa hover:bg-peach/50"
              onClick={() => applyChip(chip)}
            >
              {chip}
            </button>
          ))}
        </div>

        {notes ? <p className="rounded-lg border border-forest/15 bg-sage p-3 text-sm font-semibold text-forest">Note: {notes}</p> : null}

        {reviewed ? (
          <div className="grid gap-3 rounded-2xl border border-cocoa/10 bg-cream p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-editorial text-3xl font-semibold text-forest">Review items</h3>
              <StatusPill tone="neutral">{items.length} found</StatusPill>
            </div>
            {items.length ? (
              <div className="grid gap-3">
                {items.map((item) => (
                  <div key={item.localId} className="grid gap-2 rounded-xl border border-cocoa/10 bg-paper p-3">
                    <div className="flex items-center gap-2">
                      <input
                        className="min-h-12 flex-1 rounded-lg border border-cocoa/10 bg-cream px-3 text-base font-semibold text-cocoa"
                        aria-label={`${item.displayName} item name`}
                        value={item.displayName}
                        onChange={(event) => updateItemName(item.localId, event.target.value)}
                      />
                      <button type="button" className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-cocoa/15 text-cocoa" aria-label={`Remove ${item.displayName}`} onClick={() => removeItem(item.localId)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-bark">
                      {item.quantity ? `${item.quantity}${item.unit ? ` ${item.unit}` : ""}` : "Quantity not set"} · {item.category}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-cocoa/15 bg-paper p-4 text-sm text-bark">No items found yet.</p>
            )}
          </div>
        ) : null}

        {duplicateHint ? (
          <div className="rounded-lg border border-peachDeep/30 bg-peach/45 p-4">
            <p className="font-semibold text-cocoa">{duplicateHint.displayName} already looks similar to an active household request.</p>
            <p className="mt-1 text-sm text-bark">HomeStock will keep this visible for admin review.</p>
          </div>
        ) : null}

        {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}

        <button
          type="button"
          disabled={isSaving || (reviewed && !items.length)}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-forest px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-paper hover:bg-cocoa disabled:cursor-not-allowed disabled:bg-bark/30"
          onClick={reviewed ? submit : reviewItems}
        >
          {isSaving ? "Sending..." : reviewed ? "Send to household" : "Review items"}
          {reviewed ? <ArrowRight className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
        </button>
        <p className="text-center text-sm font-semibold text-bark">Requests go to the household admin for approval.</p>
      </section>

      <section className="grid gap-3 rounded-[1.5rem] border border-cocoa/10 bg-sage p-5 text-forest shadow-panel">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-forest/70">Your submitted requests</p>
          <h2 className="mt-1 font-editorial text-3xl font-semibold">Sent for approval</h2>
        </div>
        {submittedRequests.length ? (
          <div className="grid gap-2">
            {submittedRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between gap-3 rounded-xl border border-forest/10 bg-paper/80 px-3 py-3">
                <div>
                  <p className="font-semibold text-cocoa">{request.displayName}</p>
                  <p className="text-xs text-bark">{request.createdAtLabel}</p>
                </div>
                <StatusPill tone={statusTone(request.status)}>{request.status.replaceAll("_", " ")}</StatusPill>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-forest/20 bg-paper/60 p-4 text-sm text-bark">Requests you send will appear here with their approval status.</p>
        )}
      </section>
    </div>
  );
}

function withLocalIds(items: ParsedGroceryItem[]): EditableParsedItem[] {
  return items.map((item, index) => ({ ...item, localId: `${item.canonicalName}-${index}` }));
}

function quantitiesAreMergeable(existingUnit: string | null, incomingUnit: string | null) {
  return existingUnit === incomingUnit || existingUnit === null || incomingUnit === null;
}

function mergeNote(current: string, next: string) {
  if (!current) return next;
  if (current.includes(next)) return current;
  return `${current}; ${next}`;
}
