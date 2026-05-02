import { BellRing, BookOpenCheck, ChevronRight, Home, LockKeyhole, Settings2, ShieldCheck, ShoppingCart, Sparkles, Store } from "lucide-react";
import { CategorySection } from "@/components/CategorySection";
import { PageHeader } from "@/components/PageHeader";
import { PreservedQueryLink } from "@/components/PreservedQueryLink";
import { StatusPill } from "@/components/StatusPill";

const primaryLinks = [
  {
    href: "/notifications",
    title: "Notifications",
    description: "Review generated reminders for approvals, cart review, memory, and request status.",
    icon: BellRing,
    tone: "pending" as const
  },
  {
    href: "/cart",
    title: "Cart",
    description: "Review draft cart and approve before ordering.",
    icon: ShoppingCart,
    tone: "cart" as const
  },
  {
    href: "/memory",
    title: "Memory",
    description: "View recurring items and learned household preferences.",
    icon: Sparkles,
    tone: "approved" as const
  },
  {
    href: "/household",
    title: "Household",
    description: "Manage members, roles, approval rules, and preferences.",
    icon: Home,
    tone: "neutral" as const
  },
  {
    href: "/integrations/swiggy",
    title: "Swiggy Integration",
    description: "View Builders Club integration status and provider setup.",
    icon: Store,
    tone: "pending" as const
  }
];

const quickSettings = [
  {
    href: "/household",
    title: "Approval Rules",
    description: "Admin approval stays required before cart approval or checkout.",
    icon: ShieldCheck
  },
  {
    href: "/household",
    title: "Grocery Preferences",
    description: "Preferred brands, usual quantities, and household defaults.",
    icon: Settings2
  },
  {
    href: "/memory",
    title: "Privacy & Memory",
    description: "Control how recurring grocery memory is used.",
    icon: LockKeyhole
  }
];

export default function MorePage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="More"
        title="Household Tools"
        meta="Settings"
        description="Manage cart, memory, settings, and integrations."
      />

      <CategorySection title="Tools" count={primaryLinks.length}>
        <div className="grid gap-3 md:grid-cols-2">
          {primaryLinks.map((item) => (
            <NavigationCard key={item.href} {...item} />
          ))}
        </div>
      </CategorySection>

      <CategorySection title="Quick Settings">
        <div className="grid gap-3">
          {quickSettings.map((item) => {
            const Icon = item.icon;
            return (
              <PreservedQueryLink
                key={item.title}
                href={item.href}
                className="flex min-h-20 items-center gap-3 rounded-lg border border-cocoa/10 bg-paper p-4 shadow-panel transition hover:-translate-y-0.5 hover:bg-cream"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sage text-forest">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-cocoa">{item.title}</span>
                  <span className="mt-1 block text-sm leading-5 text-bark">{item.description}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-bark" />
              </PreservedQueryLink>
            );
          })}
        </div>
      </CategorySection>

      <section className="rounded-lg border border-forest/15 bg-sage p-5 text-forest shadow-panel">
        <div className="flex items-start gap-3">
          <BookOpenCheck className="mt-1 h-5 w-5 shrink-0" />
          <div>
            <p className="font-editorial text-2xl font-semibold">Household operating rules</p>
            <p className="mt-2 text-sm leading-6 text-forest/80">
              HomeStock keeps ordering cautious: cart drafts are separate from real checkout, Swiggy remains disconnected until configured, and admin approval is required.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function NavigationCard({
  href,
  title,
  description,
  icon: Icon,
  tone
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "pending" | "approved" | "cart" | "neutral";
}) {
  return (
    <PreservedQueryLink
      href={href}
      className="group flex min-h-28 items-start gap-4 rounded-[1.25rem] border border-cocoa/10 bg-paper p-4 shadow-editorial transition hover:-translate-y-0.5 hover:bg-cream"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-oat text-cocoa">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-editorial text-2xl font-semibold leading-none text-cocoa">{title}</span>
          <StatusPill tone={tone}>Open</StatusPill>
        </span>
        <span className="mt-2 block text-sm leading-6 text-bark">{description}</span>
      </span>
      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-bark transition group-hover:translate-x-0.5" />
    </PreservedQueryLink>
  );
}
