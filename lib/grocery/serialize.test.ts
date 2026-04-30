import { describe, expect, it } from "vitest";
import { serializeGroceryItems } from "./serialize";

describe("serializeGroceryItems", () => {
  it("includes quantity and unit when quantity exists", () => {
    expect(serializeGroceryItems([{ displayName: "Atta", quantity: 2, unit: "kg" }])).toBe("2 kg Atta");
  });

  it("omits a default unit when quantity is missing", () => {
    expect(serializeGroceryItems([{ displayName: "Coriander", quantity: null, unit: "bunch" }])).toBe("Coriander");
  });

  it("does not prefix an edited quantity-less item with its default unit", () => {
    expect(serializeGroceryItems([{ displayName: "Cherry Tomato", quantity: null, unit: "kg" }])).toBe("Cherry Tomato");
  });

  it("serializes mixed quantity and quantity-less items", () => {
    expect(
      serializeGroceryItems([
        { displayName: "Atta", quantity: 2, unit: "kg" },
        { displayName: "Cooking Oil", quantity: 1, unit: "litre" },
        { displayName: "Cherry Tomato", quantity: null, unit: "kg" },
        { displayName: "Coriander", quantity: null, unit: "bunch" }
      ])
    ).toBe("2 kg Atta, 1 litre Cooking Oil, Cherry Tomato, Coriander");
  });
});
