type StatusTone = "pending" | "approved" | "cart" | "ordered" | "rejected" | "offline" | "neutral" | "urgent";

const toneClasses: Record<StatusTone, string> = {
  pending: "border-peachDeep/30 bg-peach/45 text-cocoa",
  approved: "border-forest/25 bg-sage text-forest",
  cart: "border-lavender/40 bg-lavender/50 text-cocoa",
  ordered: "border-forest/25 bg-forest text-paper",
  rejected: "border-red-200 bg-red-50 text-red-700",
  offline: "border-cocoa/15 bg-oat text-cocoa",
  neutral: "border-cocoa/10 bg-paper text-bark",
  urgent: "border-peachDeep bg-peach text-cocoa"
};

export function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: StatusTone }) {
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] ${toneClasses[tone]}`}>{children}</span>;
}

export function statusTone(status: string): StatusTone {
  switch (status) {
    case "PENDING":
      return "pending";
    case "APPROVED":
      return "approved";
    case "ADDED_TO_CART":
      return "cart";
    case "ORDERED":
      return "ordered";
    case "REJECTED":
      return "rejected";
    case "PURCHASED_OFFLINE":
      return "offline";
    default:
      return "neutral";
  }
}
