"use client";

import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Something went wrong"
      description={error.message || "HomeStock could not load this view. Try again without changing any grocery data."}
      action={
        <button className="rounded-md bg-forest px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-paper hover:bg-cocoa" onClick={reset}>
          Try again
        </button>
      }
    />
  );
}
