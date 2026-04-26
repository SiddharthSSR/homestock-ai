import Link from "next/link";
import { AlertCircle, CheckCircle2, IndianRupee, ListChecks } from "lucide-react";
import { CategorySection } from "@/components/CategorySection";
import { EmptyState } from "@/components/EmptyState";
import { MemorySuggestionCard } from "@/components/MemorySuggestionCard";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { SummaryCard } from "@/components/SummaryCard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const dashboardSummary = {
  // TODO: Replace with a dashboard aggregate service once Phase 1 data has enough real activity.
  itemsInList: 12,
  needsApproval: 3,
  estimatedCart: "₹1,250",
  runningLow: 2
};

const runningLowItems = [
  {
    title: "Aashirvaad Atta (5kg)",
    category: "Staples",
    detail: "Last bought 28 days ago"
  },
  {
    title: "Amul Taaza Milk (1L)",
    category: "Dairy",
    detail: "Usually ordered every 2 days"
  }
];

const recentActivity = [
  {
    title: "Cook added tomato, onion, oil",
    meta: "Today",
    status: "Pending"
  },
  {
    title: "Curd and dahi were merged",
    meta: "Yesterday",
    status: "Memory"
  },
  {
    title: "Mock cart prepared for review",
    meta: "This week",
    status: "Approval"
  }
];

export default async function HomePage() {
  const household = await prisma.household.findFirst({ orderBy: { createdAt: "asc" } });
  const householdName = household?.name ?? "Sharma Family";
  const headerMeta = formatHeaderMeta(new Date());

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Household"
        title={householdName}
        meta={headerMeta}
        description="A shared grocery memory for the household. Capture requests, remember recurring needs, and approve carts only when everyone is ready."
      >
        <div className="grid md:grid-cols-2">
          <SummaryCard label="Items in list" value={dashboardSummary.itemsInList} detail="2 added today" tone="lavender" icon={ListChecks} />
          <SummaryCard
            label="Needs approval"
            value={dashboardSummary.needsApproval}
            detail="Admin review required"
            tone="peach"
            icon={AlertCircle}
            action={
              <Link className="inline-flex rounded-md bg-peachDeep px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-paper hover:bg-cocoa" href="/grocery">
                Review
              </Link>
            }
          />
        </div>
      </PageHeader>

      <section className="grid gap-3 sm:grid-cols-2">
        <SummaryCard label="Estimated cart" value={dashboardSummary.estimatedCart} detail="Mock provider estimate" tone="paper" icon={IndianRupee} />
        <SummaryCard label="Running low" value={dashboardSummary.runningLow} detail="Based on typical usage" tone="sage" icon={CheckCircle2} />
      </section>

      <CategorySection title="Running Low" count={runningLowItems.length}>
        <div className="grid gap-3">
          {runningLowItems.map((item) => (
            <MemorySuggestionCard
              key={item.title}
              title={item.title}
              detail={`${item.category} · ${item.detail}`}
              action={
                <Link className="inline-flex rounded-md border border-forest/30 bg-paper px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-forest hover:bg-cream" href="/grocery">
                  Add
                </Link>
              }
            />
          ))}
        </div>
      </CategorySection>

      <CategorySection title="Recent Activity">
        <div className="grid gap-3">
          {recentActivity.length ? (
            recentActivity.map((activity) => (
              <article key={activity.title} className="rounded-lg border border-cocoa/10 bg-paper p-4 shadow-panel">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-cocoa">{activity.title}</h3>
                    <p className="mt-1 text-sm text-bark">{activity.meta}</p>
                  </div>
                  <StatusPill tone="neutral">{activity.status}</StatusPill>
                </div>
              </article>
            ))
          ) : (
            <EmptyState title="No recent activity" description="Grocery requests and approvals will appear here." />
          )}
        </div>
      </CategorySection>
    </div>
  );
}

function formatHeaderMeta(date: Date) {
  const datePart = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "2-digit",
    timeZone: "Asia/Kolkata"
  }).format(date);
  const hour = Number(
    new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata"
    }).format(date)
  );

  const dayPart = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
  return `${datePart} ${dayPart}`;
}
