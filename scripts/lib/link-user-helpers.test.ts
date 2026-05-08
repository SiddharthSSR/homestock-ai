import { describe, expect, it } from "vitest";
import {
  assertSafetyGuards,
  chooseHousehold,
  isFixtureHousehold,
  parseLinkUserArgs
} from "./link-user-helpers";

const baseValidArgv = ["--email", "Foo@Example.com", "--role", "ADMIN", "--householdId", "h_1"];

describe("parseLinkUserArgs — valid input", () => {
  it("parses the minimum required args and lowercases the email", () => {
    const result = parseLinkUserArgs(baseValidArgv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.args).toMatchObject({
      email: "foo@example.com",
      role: "ADMIN",
      householdId: "h_1",
      householdName: undefined,
      dryRun: false,
      allowDemo: false,
      allowFixture: false,
      allowLastAdminDemote: false,
      help: false
    });
  });

  it("defaults --name to the email local-part when omitted", () => {
    const result = parseLinkUserArgs(baseValidArgv);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.args.name).toBe("foo");
  });

  it("preserves --name when provided", () => {
    const result = parseLinkUserArgs([...baseValidArgv, "--name", "Foo Bar"]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.args.name).toBe("Foo Bar");
  });

  it("accepts --householdName instead of --householdId", () => {
    const result = parseLinkUserArgs([
      "--email",
      "me@example.com",
      "--role",
      "MEMBER",
      "--householdName",
      "Family"
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.args.householdName).toBe("Family");
      expect(result.args.householdId).toBeUndefined();
    }
  });

  it("parses --dry-run and override flags", () => {
    const result = parseLinkUserArgs([
      ...baseValidArgv,
      "--dry-run",
      "--allow-demo",
      "--allow-fixture",
      "--allow-last-admin-demote"
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.args.dryRun).toBe(true);
      expect(result.args.allowDemo).toBe(true);
      expect(result.args.allowFixture).toBe(true);
      expect(result.args.allowLastAdminDemote).toBe(true);
    }
  });

  it("recognizes --help and short-circuits validation", () => {
    const result = parseLinkUserArgs(["--help"]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.args.help).toBe(true);
  });

  it("recognizes -h as an alias for --help", () => {
    const result = parseLinkUserArgs(["-h"]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.args.help).toBe(true);
  });

  it("parses --create-household-if-missing with --householdName", () => {
    const result = parseLinkUserArgs([
      "--email",
      "me@example.com",
      "--role",
      "ADMIN",
      "--householdName",
      "Smoke",
      "--create-household-if-missing"
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.args.createHouseholdIfMissing).toBe(true);
  });

  it("defaults createHouseholdIfMissing to false when omitted", () => {
    const result = parseLinkUserArgs(baseValidArgv);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.args.createHouseholdIfMissing).toBe(false);
  });
});

describe("parseLinkUserArgs — invalid input", () => {
  it("rejects an invalid email", () => {
    const result = parseLinkUserArgs(["--email", "nope", "--role", "ADMIN", "--householdId", "h_1"]);
    expect(result.ok).toBe(false);
  });

  it("rejects a missing email", () => {
    const result = parseLinkUserArgs(["--role", "ADMIN", "--householdId", "h_1"]);
    expect(result.ok).toBe(false);
  });

  it("rejects an unknown role", () => {
    const result = parseLinkUserArgs(["--email", "me@x.io", "--role", "GUEST", "--householdId", "h_1"]);
    expect(result.ok).toBe(false);
  });

  it("rejects when neither --householdId nor --householdName is given", () => {
    const result = parseLinkUserArgs(["--email", "me@x.io", "--role", "ADMIN"]);
    expect(result.ok).toBe(false);
  });

  it("rejects when both --householdId and --householdName are given", () => {
    const result = parseLinkUserArgs([
      "--email",
      "me@x.io",
      "--role",
      "ADMIN",
      "--householdId",
      "h_1",
      "--householdName",
      "Family"
    ]);
    expect(result.ok).toBe(false);
  });

  it("rejects a flag without a value", () => {
    const result = parseLinkUserArgs(["--email", "--role", "ADMIN", "--householdId", "h_1"]);
    expect(result.ok).toBe(false);
  });

  it("rejects unknown arguments", () => {
    const result = parseLinkUserArgs([...baseValidArgv, "--turbo"]);
    expect(result.ok).toBe(false);
  });

  it("rejects --create-household-if-missing combined with --householdId", () => {
    const result = parseLinkUserArgs([
      "--email",
      "me@example.com",
      "--role",
      "ADMIN",
      "--householdId",
      "h_1",
      "--create-household-if-missing"
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/--householdName/);
  });
});

describe("chooseHousehold", () => {
  const households = [
    { id: "h_1", name: "Family" },
    { id: "h_2", name: "Family" },
    { id: "h_3", name: "Office" }
  ];

  it("matches by id when present", () => {
    expect(chooseHousehold(households, { id: "h_3" })).toEqual({
      ok: true,
      household: households[2]
    });
  });

  it("returns not-found when id is missing", () => {
    expect(chooseHousehold(households, { id: "h_missing" })).toEqual({ ok: false, reason: "not-found" });
  });

  it("matches by unique name", () => {
    expect(chooseHousehold(households, { name: "Office" })).toEqual({
      ok: true,
      household: households[2]
    });
  });

  it("flags ambiguity when multiple households share a name", () => {
    const result = chooseHousehold(households, { name: "Family" });
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === "ambiguous") {
      expect(result.matches.map((h) => h.id)).toEqual(["h_1", "h_2"]);
    } else {
      throw new Error("expected ambiguous result");
    }
  });

  it("returns not-found when name does not match anything", () => {
    expect(chooseHousehold(households, { name: "Ghost" })).toEqual({ ok: false, reason: "not-found" });
  });
});

describe("isFixtureHousehold", () => {
  it.each([
    "QA Empty Household",
    "QA Starter Household",
    "QA Cart Household",
    "QA Memory Household",
    "Demo Household"
  ])("flags %s as a fixture", (name) => {
    expect(isFixtureHousehold(name)).toBe(true);
  });

  it("does not flag arbitrary names", () => {
    expect(isFixtureHousehold("Family")).toBe(false);
  });
});

describe("assertSafetyGuards — demo-mode guard", () => {
  const base = {
    householdName: "Family",
    allowFixture: false,
    allowLastAdminDemote: false,
    existingRole: null,
    targetRole: "ADMIN",
    otherAdminCount: 1
  } as const;

  it("blocks when demo mode is on without --allow-demo", () => {
    expect(assertSafetyGuards({ ...base, demoMode: true, allowDemo: false })).toEqual({
      ok: false,
      error: { kind: "demo-mode" }
    });
  });

  it("permits demo mode when --allow-demo is set", () => {
    expect(assertSafetyGuards({ ...base, demoMode: true, allowDemo: true })).toEqual({ ok: true });
  });
});

describe("assertSafetyGuards — fixture guard", () => {
  const base = {
    demoMode: false,
    allowDemo: false,
    allowLastAdminDemote: false,
    existingRole: null,
    targetRole: "ADMIN",
    otherAdminCount: 1
  } as const;

  it("blocks fixture households without --allow-fixture", () => {
    expect(assertSafetyGuards({ ...base, householdName: "QA Memory Household", allowFixture: false })).toEqual({
      ok: false,
      error: { kind: "fixture-household", householdName: "QA Memory Household" }
    });
  });

  it("permits fixture households with --allow-fixture", () => {
    expect(assertSafetyGuards({ ...base, householdName: "QA Memory Household", allowFixture: true })).toEqual({
      ok: true
    });
  });

  it("does not flag non-fixture names", () => {
    expect(assertSafetyGuards({ ...base, householdName: "Family", allowFixture: false })).toEqual({ ok: true });
  });
});

describe("assertSafetyGuards — last-admin guard", () => {
  const base = {
    householdName: "Family",
    demoMode: false,
    allowDemo: false,
    allowFixture: false,
    targetRole: "MEMBER"
  } as const;

  it("blocks demoting the only remaining ADMIN", () => {
    expect(
      assertSafetyGuards({ ...base, existingRole: "ADMIN", otherAdminCount: 0, allowLastAdminDemote: false })
    ).toEqual({ ok: false, error: { kind: "last-admin-demote", householdName: "Family" } });
  });

  it("permits demotion when --allow-last-admin-demote is set", () => {
    expect(
      assertSafetyGuards({ ...base, existingRole: "ADMIN", otherAdminCount: 0, allowLastAdminDemote: true })
    ).toEqual({ ok: true });
  });

  it("does not block when another admin exists", () => {
    expect(
      assertSafetyGuards({ ...base, existingRole: "ADMIN", otherAdminCount: 1, allowLastAdminDemote: false })
    ).toEqual({ ok: true });
  });

  it("does not block when the target role is also ADMIN", () => {
    expect(
      assertSafetyGuards({
        ...base,
        existingRole: "ADMIN",
        otherAdminCount: 0,
        allowLastAdminDemote: false,
        targetRole: "ADMIN"
      })
    ).toEqual({ ok: true });
  });

  it("does not block when no existing membership exists", () => {
    expect(
      assertSafetyGuards({ ...base, existingRole: null, otherAdminCount: 0, allowLastAdminDemote: false })
    ).toEqual({ ok: true });
  });
});

// These tests pin the contract that the fixture guard fires by household NAME
// only — it does not matter whether the household already exists or is about
// to be created via --create-household-if-missing. Regression-prevention for
// the Phase 5 create path.
describe("assertSafetyGuards — fixture guard for newly created households", () => {
  const createPathBase = {
    demoMode: false,
    allowDemo: false,
    allowLastAdminDemote: false,
    existingRole: null,
    targetRole: "ADMIN",
    otherAdminCount: 0
  } as const;

  it("blocks creating a missing fixture household without --allow-fixture", () => {
    expect(
      assertSafetyGuards({
        ...createPathBase,
        householdName: "QA Memory Household",
        allowFixture: false
      })
    ).toEqual({
      ok: false,
      error: { kind: "fixture-household", householdName: "QA Memory Household" }
    });
  });

  it("permits creating a missing fixture household with --allow-fixture", () => {
    expect(
      assertSafetyGuards({
        ...createPathBase,
        householdName: "QA Memory Household",
        allowFixture: true
      })
    ).toEqual({ ok: true });
  });

  it("permits creating a missing non-fixture household without --allow-fixture", () => {
    expect(
      assertSafetyGuards({
        ...createPathBase,
        householdName: "Auth Smoke Household",
        allowFixture: false
      })
    ).toEqual({ ok: true });
  });
});
