import { describe, expect, it } from "vitest";
import { hrefWithPreservedParams } from "./navigation";

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
