import { describe, expect, it } from "vitest";
import { getGroceryProvider } from ".";
import { calculateMockLineTotal, MockGroceryProvider } from "./mock-grocery-provider";

describe("MockGroceryProvider", () => {
  it("prepares a cart draft from approved grocery items", async () => {
    const provider = new MockGroceryProvider();
    const draft = await provider.prepareCart(
      [
        {
          requestId: "request-atta",
          canonicalName: "atta",
          displayName: "Atta",
          quantity: 2,
          unit: "kg",
          category: "Staples"
        },
        {
          requestId: "request-coriander",
          canonicalName: "coriander",
          displayName: "Coriander",
          quantity: null,
          unit: "bunch",
          category: "Vegetables"
        }
      ],
      { householdId: "household-1", location: "Bengaluru" }
    );

    expect(draft.providerCartId).toMatch(/^mock-cart-/);
    expect(draft.estimatedTotal).toBe(588);
    expect(draft.items).toMatchObject([
      {
        groceryRequestId: "request-atta",
        productName: "Whole Wheat Atta",
        brand: "Aashirvaad",
        price: 285,
        availabilityStatus: "AVAILABLE",
        quantity: 2
      },
      {
        groceryRequestId: "request-coriander",
        productName: "Coriander Leaves",
        brand: "Fresh Produce",
        price: 18,
        availabilityStatus: "AVAILABLE",
        quantity: null
      }
    ]);
  });

  it("uses quantity as a mock package multiplier when estimating line totals", () => {
    expect(calculateMockLineTotal(165, 2)).toBe(330);
    expect(calculateMockLineTotal(18, null)).toBe(18);
    expect(calculateMockLineTotal(42, 0)).toBe(42);
  });

  it("uses a mock substitute with a clear reason when catalog has no exact match", async () => {
    const provider = new MockGroceryProvider();
    const [result] = await provider.searchProducts("Cherry Tomato", { householdId: "household-1" });

    expect(result).toMatchObject({
      productId: "mock-cherry-tomato",
      productName: "Cherry Tomato",
      brand: "Mock Essentials",
      price: 99,
      availabilityStatus: "SUBSTITUTED",
      substitutionReason: "No exact mock catalog match; showing a placeholder substitute."
    });
  });

  it("is the provider used by safe default provider selection", () => {
    expect(getGroceryProvider()).toBeInstanceOf(MockGroceryProvider);
  });
});
