import type { LucideIcon } from "lucide-react";
import { ClipboardList } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon: Icon = ClipboardList,
  action
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-cocoa/20 bg-paper p-6 text-center shadow-panel">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cream text-forest">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-editorial mt-4 text-2xl font-semibold text-cocoa">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-bark">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
