import { isDemoModeEnabled } from "@/lib/household-selection";
import { resolveCurrentActorId } from "@/lib/services/household-service";
import { prisma } from "@/lib/prisma";

// Lazy import to keep next-auth out of the module graph in unit tests that
// inject a `getSession` mock and never need real Auth.js.
async function callAuth() {
  const mod = await import("@/lib/auth/config");
  return mod.auth();
}

export type CurrentActorResolution =
  | { ok: true; actorId: string; source: "demo" | "session" }
  | { ok: false; reason: "auth-required" | "forbidden" | "household-required" };

export type CurrentActorOptions = {
  // Demo-mode only: actorId from query/body to mimic the chosen actor.
  // Ignored in non-demo mode.
  queryActorId?: string | null;
  // Injection seams for tests and for callers that already have a session.
  getSession?: () => Promise<{ user?: { id?: string | null } | null } | null>;
  resolveDemoActorId?: (householdId: string, actorId?: string) => Promise<string>;
  findMembership?: (householdId: string, userId: string) => Promise<{ userId: string } | null>;
};

const defaultFindMembership = async (householdId: string, userId: string) =>
  prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
    select: { userId: true }
  });

export async function getCurrentActor(
  householdId: string | null | undefined,
  options: CurrentActorOptions = {}
): Promise<CurrentActorResolution> {
  if (!householdId) return { ok: false, reason: "household-required" };

  if (isDemoModeEnabled()) {
    const resolveDemo = options.resolveDemoActorId ?? resolveCurrentActorId;
    const actorId = await resolveDemo(householdId, options.queryActorId ?? undefined);
    return { ok: true, actorId, source: "demo" };
  }

  const getSession = options.getSession ?? callAuth;
  const session = await getSession();
  const userId = session?.user?.id ?? null;
  if (!userId) return { ok: false, reason: "auth-required" };

  const findMembership = options.findMembership ?? defaultFindMembership;
  const membership = await findMembership(householdId, userId);
  if (!membership) return { ok: false, reason: "forbidden" };

  return { ok: true, actorId: userId, source: "session" };
}

export class AuthRequiredError extends Error {
  status = 401;
  constructor() {
    super("Authentication required");
    this.name = "AuthRequiredError";
  }
}

export class HouseholdForbiddenError extends Error {
  status = 403;
  constructor() {
    super("Not a member of the household");
    this.name = "HouseholdForbiddenError";
  }
}

export class HouseholdRequiredError extends Error {
  status = 400;
  constructor() {
    super("householdId is required");
    this.name = "HouseholdRequiredError";
  }
}

export async function requireCurrentActor(
  householdId: string | null | undefined,
  options: CurrentActorOptions = {}
) {
  const resolution = await getCurrentActor(householdId, options);
  if (resolution.ok) return resolution;
  if (resolution.reason === "auth-required") throw new AuthRequiredError();
  if (resolution.reason === "forbidden") throw new HouseholdForbiddenError();
  throw new HouseholdRequiredError();
}
