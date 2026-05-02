import type { InAppReminder } from "@/lib/services/reminder-service";
import { EmptyState } from "./EmptyState";
import { ReminderCard } from "./ReminderCard";

export function ReminderList({
  reminders,
  emptyTitle = "Nothing needs attention",
  emptyDescription = "HomeStock will surface grocery approvals, cart reviews, running-low items, and request status updates here."
}: {
  reminders: InAppReminder[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!reminders.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {reminders.map((reminder) => (
        <ReminderCard key={reminder.id} reminder={reminder} />
      ))}
    </div>
  );
}
