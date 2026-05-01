import { describe, expect, it } from "vitest";
import { resolveSelectedHousehold } from "./household-selection";

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
