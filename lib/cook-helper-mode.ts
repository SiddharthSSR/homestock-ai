import type { HouseholdRole } from "@prisma/client";

export type AddRequestExperience = "cook-helper" | "standard";

export function getAddRequestExperience(role: HouseholdRole | null | undefined): AddRequestExperience {
  return role === "COOK" ? "cook-helper" : "standard";
}

export function buildCookHelperNotes(notes?: string) {
  return ["Submitted from cook helper mode.", notes?.trim()].filter(Boolean).join("\n");
}
