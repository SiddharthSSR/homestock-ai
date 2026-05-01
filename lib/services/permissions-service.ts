import type { HouseholdRole } from "@prisma/client";
import { prisma } from "../prisma";

export type HouseholdPermission =
  | "grocery:add"
  | "grocery:approve"
  | "grocery:edit"
  | "cart:prepare"
  | "cart:edit"
  | "cart:approve"
  | "memory:add-suggestion"
  | "memory:dismiss-suggestion"
  | "household:manage";

export class PermissionError extends Error {
  status = 403;

  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "PermissionError";
  }
}

export function canRole(role: HouseholdRole | null | undefined, permission: HouseholdPermission) {
  if (!role) return false;
  if (role === "ADMIN") return true;

  if (role === "MEMBER") {
    return permission === "grocery:add" || permission === "memory:add-suggestion" || permission === "memory:dismiss-suggestion";
  }

  if (role === "COOK") {
    return permission === "grocery:add";
  }

  return false;
}

export async function getHouseholdRole(householdId: string, actorId: string) {
  const membership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId: actorId
      }
    },
    select: { role: true }
  });

  return membership?.role ?? null;
}

export async function assertHouseholdPermission(householdId: string, actorId: string, permission: HouseholdPermission) {
  const role = await getHouseholdRole(householdId, actorId);

  if (!canRole(role, permission)) {
    throw new PermissionError(messageFor(permission));
  }

  return role;
}

export function roleCapabilities(role: HouseholdRole | null | undefined) {
  return {
    canAddGrocery: canRole(role, "grocery:add"),
    canApproveGrocery: canRole(role, "grocery:approve"),
    canEditGrocery: canRole(role, "grocery:edit"),
    canPrepareCart: canRole(role, "cart:prepare"),
    canEditCart: canRole(role, "cart:edit"),
    canApproveCart: canRole(role, "cart:approve"),
    canAddMemorySuggestion: canRole(role, "memory:add-suggestion"),
    canDismissMemorySuggestion: canRole(role, "memory:dismiss-suggestion"),
    canManageHousehold: canRole(role, "household:manage")
  };
}

function messageFor(permission: HouseholdPermission) {
  if (permission.startsWith("cart")) return "Only household admins can manage or approve cart drafts.";
  if (permission === "grocery:approve") return "Only household admins can approve or reject grocery requests.";
  if (permission === "grocery:edit") return "Only household admins can edit grocery request status or quantities.";
  if (permission === "household:manage") return "Only household admins can manage household settings.";
  if (permission === "memory:add-suggestion") return "Only household admins and members can add memory suggestions.";
  if (permission === "memory:dismiss-suggestion") return "Only household admins and members can dismiss memory suggestions.";
  return "Only household members can add grocery requests.";
}
