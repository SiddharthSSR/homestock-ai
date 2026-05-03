import { describe, expect, it } from "vitest";
import { isDemoModeEnabled, pickDemoDefaultHousehold, resolveSelectedHousehold } from "./household-selection";

describe("resolveSelectedHousehold", () => {
  const households = [
    { id: "household-1", name: "First" },
    { id: "household-2", name: "Second" }
  ];

  it("uses a valid query household when present", () => {
    expect(resolveSelectedHousehold(households, "household-2")).toEqual(households[1]);
  });

  it("falls back to the first household when query household is missing or invalid", () => {
    expect(resolveSelectedHousehold(households, undefined)).toEqual(households[0]);
    expect(resolveSelectedHousehold(households, "missing-household")).toEqual(households[0]);
  });

  it("returns null when there are no households", () => {
    expect(resolveSelectedHousehold([], "household-1")).toBeNull();
  });
});

describe("pickDemoDefaultHousehold", () => {
  const households = [
    { id: "h-my", name: "My Household" },
    { id: "h-empty", name: "QA Empty Household" },
    { id: "h-starter", name: "QA Starter Household" },
    { id: "h-cart", name: "QA Cart Household" },
    { id: "h-memory", name: "QA Memory Household" }
  ];

  it("prefers QA Memory Household first", () => {
    expect(pickDemoDefaultHousehold(households)?.id).toBe("h-memory");
  });

  it("prefers QA Starter Household when Memory is missing", () => {
    expect(pickDemoDefaultHousehold(households.filter((h) => h.name !== "QA Memory Household"))?.id).toBe("h-starter");
  });

  it("prefers QA Cart Household when Memory and Starter are missing", () => {
    expect(
      pickDemoDefaultHousehold(
        households.filter((h) => h.name !== "QA Memory Household" && h.name !== "QA Starter Household")
      )?.id
    ).toBe("h-cart");
  });

  it("falls back to the first household when no QA household matches", () => {
    expect(pickDemoDefaultHousehold([{ id: "h-other", name: "Other" }, { id: "h-my", name: "My Household" }])?.id).toBe("h-other");
  });

  it("returns null when there are no households", () => {
    expect(pickDemoDefaultHousehold([])).toBeNull();
  });
});

describe("isDemoModeEnabled", () => {
  it("returns true when NEXT_PUBLIC_DEMO_MODE is the string 'true'", () => {
    expect(isDemoModeEnabled({ NEXT_PUBLIC_DEMO_MODE: "true" })).toBe(true);
  });

  it("returns true when DEMO_MODE is the string 'true'", () => {
    expect(isDemoModeEnabled({ DEMO_MODE: "true" })).toBe(true);
  });

  it("returns false otherwise", () => {
    expect(isDemoModeEnabled({})).toBe(false);
    expect(isDemoModeEnabled({ NEXT_PUBLIC_DEMO_MODE: "false" })).toBe(false);
  });
});
