import type { CartDraft, GroceryRequest, HouseholdRole } from "@prisma/client";
import { CartDraftStatus, GroceryRequestStatus } from "@prisma/client";
import { hrefWithPreservedParams, type PreservedNavigationParams } from "../navigation";
import { prisma } from "../prisma";
import { getHouseholdMemory, type HouseholdMemory } from "./memory-service";
import { getHouseholdRole } from "./permissions-service";

export type ReminderType = "PENDING_APPROVAL" | "CART_REVIEW" | "RUNNING_LOW" | "COOK_REQUEST_STATUS";
export type ReminderGroup = "needsAction" | "runningLow" | "statusUpdates";
export type ReminderPriority = "LOW" | "MEDIUM" | "HIGH";

export type InAppReminder = {
  id: string;
  type: ReminderType;
  group: ReminderGroup;
  title: string;
  description: string;
  priority: ReminderPriority;
  actionHref: string;
  actionLabel: string;
  visibleTo: HouseholdRole[];
  generatedAt: Date;
  count?: number;
};

type ReminderRequest = Pick<GroceryRequest, "id" | "displayName" | "status" | "urgency" | "createdAt" | "requestedBy">;
type ReminderCart = Pick<CartDraft, "id" | "status" | "estimatedTotal" | "createdAt"> | null;

export async function getHouseholdReminders({
  householdId,
  actorId,
  now = new Date()
}: {
  householdId: string;
  actorId: string;
  now?: Date;
}) {
  const role = await getHouseholdRole(householdId, actorId);
  const [requests, latestReadyCart, memory] = await Promise.all([
    prisma.groceryRequest.findMany({
      where: { householdId },
      orderBy: { createdAt: "desc" }
    }),
    prisma.cartDraft.findFirst({
      where: {
        householdId,
        status: CartDraftStatus.READY_FOR_APPROVAL
      },
      orderBy: { createdAt: "desc" }
    }),
    getHouseholdMemory(householdId, now)
  ]);

  return generateReminders({
    role,
    actorId,
    requests,
    latestReadyCart,
    memory,
    now
  });
}

export function generateReminders({
  role,
  actorId,
  requests,
  latestReadyCart,
  memory,
  now = new Date()
}: {
  role: HouseholdRole | null | undefined;
  actorId: string;
  requests: ReminderRequest[];
  latestReadyCart: ReminderCart;
  memory: HouseholdMemory;
  now?: Date;
}) {
  if (!role) return [];

  const reminders: InAppReminder[] = [];
  const pendingRequests = requests.filter((request) => request.status === GroceryRequestStatus.PENDING);
  const urgentPendingCount = pendingRequests.filter((request) => request.urgency === "HIGH").length;

  if (role === "ADMIN" && pendingRequests.length) {
    reminders.push({
      id: "pending-approval",
      type: "PENDING_APPROVAL",
      group: "needsAction",
      title: `${pendingRequests.length} grocery request${pendingRequests.length === 1 ? "" : "s"} need approval`,
      description: urgentPendingCount ? `${urgentPendingCount} urgent item${urgentPendingCount === 1 ? "" : "s"} should be reviewed before preparing a cart.` : "Review pending household requests before they move toward a cart.",
      priority: urgentPendingCount ? "HIGH" : "MEDIUM",
      actionHref: "/approve",
      actionLabel: "Review requests",
      visibleTo: ["ADMIN"],
      generatedAt: now,
      count: pendingRequests.length
    });
  }

  if (role === "ADMIN" && latestReadyCart) {
    reminders.push({
      id: `cart-review-${latestReadyCart.id}`,
      type: "CART_REVIEW",
      group: "needsAction",
      title: "Cart draft is ready for review",
      description: `A mock cart draft estimated at Rs ${latestReadyCart.estimatedTotal.toFixed(0)} is waiting for admin approval. No real checkout will happen.`,
      priority: "HIGH",
      actionHref: "/cart",
      actionLabel: "Review cart",
      visibleTo: ["ADMIN"],
      generatedAt: now,
      count: 1
    });
  }

  if (role === "ADMIN" || role === "MEMBER") {
    for (const suggestion of [...memory.dueSoon, ...memory.monthlyStaples].slice(0, 3)) {
      reminders.push({
        id: `running-low-${suggestion.id}`,
        type: "RUNNING_LOW",
        group: "runningLow",
        title: `${suggestion.displayName} may need attention`,
        description: suggestion.reason,
        priority: suggestion.source === "setup" ? "LOW" : "MEDIUM",
        actionHref: "/memory",
        actionLabel: "Open memory",
        visibleTo: ["ADMIN", "MEMBER"],
        generatedAt: now
      });
    }
  }

  if (role === "COOK") {
    const activeCookStatuses = new Set<GroceryRequestStatus>([GroceryRequestStatus.PENDING, GroceryRequestStatus.APPROVED, GroceryRequestStatus.ADDED_TO_CART]);
    const ownActiveRequests = requests.filter((request) => request.requestedBy === actorId && activeCookStatuses.has(request.status));
    const pendingCount = ownActiveRequests.filter((request) => request.status === GroceryRequestStatus.PENDING).length;
    const approvedCount = ownActiveRequests.filter((request) => request.status === GroceryRequestStatus.APPROVED).length;
    const cartCount = ownActiveRequests.filter((request) => request.status === GroceryRequestStatus.ADDED_TO_CART).length;

    if (ownActiveRequests.length) {
      reminders.push({
        id: "cook-request-status",
        type: "COOK_REQUEST_STATUS",
        group: "statusUpdates",
        title: "Your grocery requests are being reviewed",
        description: formatCookStatus({ pendingCount, approvedCount, cartCount }),
        priority: pendingCount ? "MEDIUM" : "LOW",
        actionHref: "/grocery",
        actionLabel: "View list",
        visibleTo: ["COOK"],
        generatedAt: now,
        count: ownActiveRequests.length
      });
    }
  }

  return reminders.sort(sortReminders);
}

export function groupedReminders(reminders: InAppReminder[]) {
  return {
    needsAction: reminders.filter((reminder) => reminder.group === "needsAction"),
    runningLow: reminders.filter((reminder) => reminder.group === "runningLow"),
    statusUpdates: reminders.filter((reminder) => reminder.group === "statusUpdates")
  };
}

export function reminderHref(reminder: InAppReminder, params: PreservedNavigationParams) {
  return hrefWithPreservedParams(reminder.actionHref, params);
}

function formatCookStatus({ pendingCount, approvedCount, cartCount }: { pendingCount: number; approvedCount: number; cartCount: number }) {
  const parts = [
    pendingCount ? `${pendingCount} pending approval` : null,
    approvedCount ? `${approvedCount} approved` : null,
    cartCount ? `${cartCount} added to cart` : null
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "Your submitted grocery requests are visible to the household.";
}

function sortReminders(a: InAppReminder, b: InAppReminder) {
  const priorityOrder: Record<ReminderPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return priorityOrder[a.priority] - priorityOrder[b.priority] || a.title.localeCompare(b.title);
}
