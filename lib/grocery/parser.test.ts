import { describe, expect, it } from "vitest";
import { parseGroceryText } from "./parser";

describe("parseGroceryText", () => {
  it("parses quantity, unit, English items, and Hinglish synonyms", () => {
    expect(parseGroceryText("Need 2 kg atta, 1 litre oil, tomatoes and coriander")).toMatchObject([
      { name: "atta", canonicalName: "atta", quantity: 2, unit: "kg" },
      { name: "oil", canonicalName: "oil", quantity: 1, unit: "litre" },
      { canonicalName: "tomato", quantity: null },
      { canonicalName: "coriander", quantity: null }
    ]);
  });

  it("normalizes common Indian grocery synonyms", () => {
    expect(parseGroceryText("dahi, dhaniya, tamatar, pyaaz, doodh, chawal, tel").map((item) => item.canonicalName)).toEqual([
      "curd",
      "coriander",
      "tomato",
      "onion",
      "milk",
      "rice",
      "oil"
    ]);
  });

  it("strips common timing context from item names", () => {
    expect(parseGroceryText("need 2 kg atta for today")).toMatchObject([{ name: "atta", canonicalName: "atta", quantity: 2, unit: "kg" }]);
    expect(parseGroceryText("please add 1 litre oil for tomorrow")).toMatchObject([{ name: "oil", canonicalName: "oil", quantity: 1, unit: "litre" }]);
  });
});
