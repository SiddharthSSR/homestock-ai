"use client";

import Link from "next/link";
import { CheckCircle2, Home, ListChecks, Plus } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/grocery", label: "List", icon: ListChecks },
  { href: "/grocery", label: "Add", icon: Plus },
  { href: "/cart", label: "Approve", icon: CheckCircle2 }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-cocoa/10 bg-cream/95 px-3 pb-3 pt-2 shadow-[0_-12px_30px_rgba(45,33,28,0.08)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="relative grid justify-items-center gap-1 rounded-md px-2 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-bark"
            >
              {active ? <span className="absolute -top-2 h-2 w-2 rounded-full bg-peachDeep" /> : null}
              <Icon className={`h-5 w-5 ${active ? "text-forest" : "text-bark"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
