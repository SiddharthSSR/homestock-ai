import { CartDraftStatus, GroceryRequestStatus, type HouseholdRole } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { generateReminders, reminderHref } from "./reminder-service";
import type { HouseholdMemory } from "./memory-service";

const now = new Date("2026-05-01T10:00:00.000Z");

const emptyMemory: HouseholdMemory = {
  dueSoon: [],
  monthlyStaples: [],
  frequentItems: [],
  learnedPreferences: [],
  fallbackUsed: false,
  generatedAt: now
};

function request(overrides: Partial<Parameters<typeof generateReminders>[0]["requests"][number]> = {}) {
  return {
    id: "request-1",
    displayName: "Tomato",
    status: GroceryRequestStatus.PENDING,
    urgency: "MEDIUM" as const,
    createdAt: now,
    requestedBy: "cook-1",
    ...overrides
  };
}

function remindersFor(role: HouseholdRole, overrides: Partial<Parameters<typeof generateReminders>[0]> = {}) {
  return generateReminders({
    role,
    actorId: role === "COOK" ? "cook-1" : "actor-1",
    requests: [],
    latestReadyCart: null,
    memory: emptyMemory,
    now,
    ...overrides
  });
}

describe("generateReminders", () => {
  it("shows pending approval reminders to admins", () => {
    const reminders = remindersFor("ADMIN", {
      requests: [request(), request({ id: "request-2", urgency: "HIGH" })]
    });

    expect(reminders).toContainEqual(
      expect.objectContaining({
        type: "PENDING_APPROVAL",
        priority: "HIGH",
        count: 2,
        actionHref: "/approve"
      })
    );
  });

  it("shows cart review reminders to admins", () => {
    const reminders = remindersFor("ADMIN", {
      latestReadyCart: {
        id: "cart-1",
        status: CartDraftStatus.READY_FOR_APPROVAL,
        estimatedTotal: 1250,
        createdAt: now
      }
    });

    expect(reminders).toContainEqual(
      expect.objectContaining({
        type: "CART_REVIEW",
        actionHref: "/cart"
      })
    );
  });

  it("does not show admin reminders to cooks", () => {
    const reminders = remindersFor("COOK", {
      requests: [request()],
      latestReadyCart: {
        id: "cart-1",
        status: CartDraftStatus.READY_FOR_APPROVAL,
        estimatedTotal: 1250,
        createdAt: now
      }
    });

    expect(reminders.some((reminder) => reminder.type === "PENDING_APPROVAL")).toBe(false);
    expect(reminders.some((reminder) => reminder.type === "CART_REVIEW")).toBe(false);
  });

  it("shows running-low reminders to admins and members", () => {
    const memory: HouseholdMemory = {
      ...emptyMemory,
      dueSoon: [
        {
          id: "due-milk",
          type: "DUE_SOON",
          canonicalName: "milk",
          displayName: "Milk",
          category: "Dairy",
          reason: "Milk — usually expected every 2-3 days. Last seen 3 days ago.",
          confidence: 0.8,
          lastSeenAt: now,
          suggestedQuantity: 1,
          suggestedUnit: "litre",
          actionLabel: "Add to list",
          source: "learned",
          isFallback: false
        }
      ]
    };

    expect(remindersFor("ADMIN", { memory }).some((reminder) => reminder.type === "RUNNING_LOW")).toBe(true);
    expect(remindersFor("MEMBER", { memory }).some((reminder) => reminder.type === "RUNNING_LOW")).toBe(true);
    expect(remindersFor("COOK", { memory }).some((reminder) => reminder.type === "RUNNING_LOW")).toBe(false);
  });

  it("uses filtered memory input for running-low reminders", () => {
    const reminders = remindersFor("MEMBER", { memory: emptyMemory });

    expect(reminders.some((reminder) => reminder.type === "RUNNING_LOW")).toBe(false);
  });

  it("shows submitted request status to cooks", () => {
    const reminders = remindersFor("COOK", {
      requests: [
        request({ id: "request-1", requestedBy: "cook-1", status: GroceryRequestStatus.PENDING }),
        request({ id: "request-2", requestedBy: "cook-1", status: GroceryRequestStatus.APPROVED }),
        request({ id: "request-3", requestedBy: "other-user", status: GroceryRequestStatus.PENDING })
      ]
    });

    expect(reminders).toContainEqual(
      expect.objectContaining({
        type: "COOK_REQUEST_STATUS",
        count: 2
      })
    );
  });

  it("preserves household and actor query params for reminder links", () => {
    expect(reminderHref({ ...remindersFor("ADMIN", { requests: [request()] })[0] }, { householdId: "household-1", actorId: "admin-1" })).toBe("/approve?householdId=household-1&actorId=admin-1");
  });
});
