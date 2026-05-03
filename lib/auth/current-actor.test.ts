import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AuthRequiredError,
  HouseholdForbiddenError,
  HouseholdRequiredError,
  getCurrentActor,
  requireCurrentActor
} from "./current-actor";

const originalDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
const originalDemoServer = process.env.DEMO_MODE;

function setDemo(on: boolean) {
  if (on) {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    process.env.DEMO_MODE = "true";
  } else {
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.DEMO_MODE;
  }
}

afterEach(() => {
  if (originalDemo === undefined) delete process.env.NEXT_PUBLIC_DEMO_MODE;
  else process.env.NEXT_PUBLIC_DEMO_MODE = originalDemo;
  if (originalDemoServer === undefined) delete process.env.DEMO_MODE;
  else process.env.DEMO_MODE = originalDemoServer;
});

describe("getCurrentActor — demo mode", () => {
  beforeEach(() => setDemo(true));

  it("delegates to the demo resolver and tags the source as 'demo'", async () => {
    const result = await getCurrentActor("household-1", {
      queryActorId: "actor-from-query",
      resolveDemoActorId: async (_householdId, actorId) => actorId ?? "fallback"
    });

    expect(result).toEqual({ ok: true, actorId: "actor-from-query", source: "demo" });
  });

  it("ignores any provided session in demo mode", async () => {
    const result = await getCurrentActor("household-1", {
      getSession: async () => ({ user: { id: "should-be-ignored" } }),
      resolveDemoActorId: async () => "demo-actor"
    });

    expect(result).toEqual({ ok: true, actorId: "demo-actor", source: "demo" });
  });
});

describe("getCurrentActor — non-demo mode", () => {
  beforeEach(() => setDemo(false));

  it("returns auth-required when there is no session", async () => {
    const result = await getCurrentActor("household-1", {
      getSession: async () => null,
      findMembership: async () => null
    });

    expect(result).toEqual({ ok: false, reason: "auth-required" });
  });

  it("returns forbidden when the session user is not a household member", async () => {
    const result = await getCurrentActor("household-1", {
      getSession: async () => ({ user: { id: "user-without-membership" } }),
      findMembership: async () => null
    });

    expect(result).toEqual({ ok: false, reason: "forbidden" });
  });

  it("resolves to the session user id when membership exists", async () => {
    const result = await getCurrentActor("household-1", {
      getSession: async () => ({ user: { id: "user-1" } }),
      findMembership: async () => ({ userId: "user-1" })
    });

    expect(result).toEqual({ ok: true, actorId: "user-1", source: "session" });
  });

  it("ignores actorId from the query string in non-demo mode", async () => {
    const result = await getCurrentActor("household-1", {
      queryActorId: "user-spoof",
      getSession: async () => ({ user: { id: "user-real" } }),
      findMembership: async () => ({ userId: "user-real" })
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.actorId).toBe("user-real");
  });
});

describe("getCurrentActor — bad input", () => {
  it("returns household-required when householdId is missing", async () => {
    const result = await getCurrentActor(undefined);
    expect(result).toEqual({ ok: false, reason: "household-required" });
  });
});

describe("requireCurrentActor", () => {
  beforeEach(() => setDemo(false));

  it("throws AuthRequiredError when no session", async () => {
    await expect(
      requireCurrentActor("household-1", { getSession: async () => null, findMembership: async () => null })
    ).rejects.toBeInstanceOf(AuthRequiredError);
  });

  it("throws HouseholdForbiddenError when session user is not a member", async () => {
    await expect(
      requireCurrentActor("household-1", {
        getSession: async () => ({ user: { id: "x" } }),
        findMembership: async () => null
      })
    ).rejects.toBeInstanceOf(HouseholdForbiddenError);
  });

  it("throws HouseholdRequiredError when householdId is missing", async () => {
    await expect(requireCurrentActor(undefined)).rejects.toBeInstanceOf(HouseholdRequiredError);
  });

  it("returns the resolution when authenticated and a member", async () => {
    const result = await requireCurrentActor("household-1", {
      getSession: async () => ({ user: { id: "user-1" } }),
      findMembership: async () => ({ userId: "user-1" })
    });
    expect(result).toEqual({ ok: true, actorId: "user-1", source: "session" });
  });
});
