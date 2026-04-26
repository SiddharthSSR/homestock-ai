import { MockGroceryProvider } from "./mock-grocery-provider";
import { SwiggyInstamartProvider } from "./swiggy-instamart-provider";
import type { GroceryCommerceProvider } from "./types";

export function getGroceryProvider(provider = "MOCK"): GroceryCommerceProvider {
  if (provider === "SWIGGY_INSTAMART") return new SwiggyInstamartProvider();
  return new MockGroceryProvider();
}
