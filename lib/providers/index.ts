import { MockGroceryProvider } from "./mock-grocery-provider";
import { SwiggyInstamartProvider } from "./swiggy-instamart-provider";
import { getGroceryProviderConfig, type GroceryProviderKey } from "./config";
import type { GroceryCommerceProvider } from "./types";

export function getGroceryProvider(provider: GroceryProviderKey = getGroceryProviderConfig().activeProvider): GroceryCommerceProvider {
  if (provider === "SWIGGY_INSTAMART") return new SwiggyInstamartProvider();
  return new MockGroceryProvider();
}

export { getGroceryProviderConfig };
export type { GroceryProviderKey };
