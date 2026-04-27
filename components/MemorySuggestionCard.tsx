import { Clock3 } from "lucide-react";

export function MemorySuggestionCard({
  title,
  detail,
  action
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <article className="rounded-lg border border-forest/15 bg-sage p-4 text-forest shadow-panel">
      <div className="flex items-start gap-3">
        <span className="rounded-md bg-paper/70 p-2">
          <Clock3 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-editorial text-2xl font-semibold leading-tight">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-forest/80">{detail}</p>
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </article>
  );
}
