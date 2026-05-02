import { BellRing, ChevronRight } from "lucide-react";
import type { InAppReminder } from "@/lib/services/reminder-service";
import { PreservedQueryLink } from "./PreservedQueryLink";
import { StatusPill } from "./StatusPill";

const priorityTone: Record<InAppReminder["priority"], "urgent" | "pending" | "neutral"> = {
  HIGH: "urgent",
  MEDIUM: "pending",
  LOW: "neutral"
};

export function ReminderCard({ reminder }: { reminder: InAppReminder }) {
  return (
    <article className="rounded-lg border border-cocoa/10 bg-paper p-4 shadow-panel">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-peach text-cocoa">
          <BellRing className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={priorityTone[reminder.priority]}>{reminder.priority}</StatusPill>
            <StatusPill tone="neutral">{formatType(reminder.type)}</StatusPill>
          </div>
          <h3 className="font-editorial mt-3 text-2xl font-semibold leading-tight text-cocoa">{reminder.title}</h3>
          <p className="mt-2 text-sm leading-6 text-bark">{reminder.description}</p>
          <PreservedQueryLink
            href={reminder.actionHref}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-md border border-cocoa/15 bg-cream px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cocoa hover:bg-oat"
          >
            {reminder.actionLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </PreservedQueryLink>
        </div>
      </div>
    </article>
  );
}

function formatType(type: InAppReminder["type"]) {
  return type.replace(/_/g, " ").toLowerCase();
}
