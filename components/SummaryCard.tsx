import type { LucideIcon } from "lucide-react";

type SummaryCardTone = "lavender" | "peach" | "sage" | "paper";

const toneClasses: Record<SummaryCardTone, string> = {
  lavender: "bg-lavender text-cocoa",
  peach: "bg-peach text-cocoa",
  sage: "bg-sage text-forest",
  paper: "bg-paper text-cocoa"
};

export function SummaryCard({
  label,
  value,
  detail,
  action,
  icon: Icon,
  tone = "paper"
}: {
  label: string;
  value: string | number;
  detail?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  tone?: SummaryCardTone;
}) {
  return (
    <article className={`rounded-lg border border-cocoa/10 p-5 shadow-panel ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] opacity-75">{label}</p>
          <p className="font-editorial mt-4 text-5xl leading-none">{value}</p>
        </div>
        {Icon ? <Icon className="h-5 w-5 opacity-70" /> : null}
      </div>
      {detail ? <p className="mt-5 text-sm font-medium opacity-80">{detail}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </article>
  );
}
