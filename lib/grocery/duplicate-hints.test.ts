import { describe, expect, it } from "vitest";
import { findDuplicateHints } from "./duplicate-hints";

describe("findDuplicateHints", () => {
  it("returns no hints when active requests have no display-name conflict", () => {
    expect(
      findDuplicateHints([
        { canonicalName: "curd", displayName: "Curd", status: "PENDING" },
        { canonicalName: "oil", displayName: "Cooking Oil", status: "APPROVED" }
      ])
    ).toEqual([]);
  });

  it("returns dynamic hints for active duplicate canonical items with different display names", () => {
    expect(
      findDuplicateHints([
        { canonicalName: "curd", displayName: "Dahi", status: "PENDING" },
        { canonicalName: "curd", displayName: "Curd", status: "APPROVED" },
        { canonicalName: "atta", displayName: "Atta", status: "REJECTED" },
        { canonicalName: "atta", displayName: "Aata", status: "REJECTED" }
      ])
    ).toEqual([{ canonicalName: "curd", names: ["Dahi", "Curd"] }]);
  });
});
