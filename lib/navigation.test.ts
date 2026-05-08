import { describe, expect, it } from "vitest";
import { hrefWithPreservedParams, selectPreservedParams } from "./navigation";

describe("hrefWithPreservedParams", () => {
  it("preserves the current actor and household for internal app links", () => {
    expect(hrefWithPreservedParams("/approve", { actorId: "member-1", householdId: "household-1" })).toBe("/approve?householdId=household-1&actorId=member-1");
  });

  it("does not overwrite explicit href params", () => {
    expect(hrefWithPreservedParams("/cart?actorId=admin-1", { actorId: "member-1", householdId: "household-1" })).toBe("/cart?actorId=admin-1&householdId=household-1");
  });

  it("leaves links unchanged when there is no role context", () => {
    expect(hrefWithPreservedParams("/grocery", {})).toBe("/grocery");
  });

  it("does not alter external links", () => {
    expect(hrefWithPreservedParams("https://mcp.swiggy.com/builders", { actorId: "member-1" })).toBe("https://mcp.swiggy.com/builders");
  });
});

describe("selectPreservedParams", () => {
  it("preserves both actorId and householdId in demo mode", () => {
    expect(selectPreservedParams({ actorId: "member-1", householdId: "household-1", demoMode: true })).toEqual({
      actorId: "member-1",
      householdId: "household-1"
    });
  });

  it("drops actorId in non-demo mode but keeps householdId", () => {
    expect(selectPreservedParams({ actorId: "member-1", householdId: "household-1", demoMode: false })).toEqual({
      actorId: null,
      householdId: "household-1"
    });
  });

  it("nulls out missing params consistently", () => {
    expect(selectPreservedParams({ demoMode: true })).toEqual({ actorId: null, householdId: null });
    expect(selectPreservedParams({ demoMode: false })).toEqual({ actorId: null, householdId: null });
  });

  it("end-to-end with hrefWithPreservedParams in non-demo mode strips actorId from links", () => {
    const preserved = selectPreservedParams({ actorId: "spoof", householdId: "h-1", demoMode: false });
    expect(hrefWithPreservedParams("/approve", preserved)).toBe("/approve?householdId=h-1");
  });
});
