import { describe, expect, it, vi } from "vitest";
import { MockGroceryProvider } from "./mock-grocery-provider";
import { getGroceryProvider, getGroceryProviderConfig } from "./index";
import { SwiggyInstamartProvider, SwiggyProviderNotConfiguredError } from "./swiggy-instamart-provider";

describe("provider readiness", () => {
  it("keeps the mock provider as the default provider", () => {
    expect(getGroceryProvider()).toBeInstanceOf(MockGroceryProvider);
    expect(getGroceryProviderConfig({}).activeProvider).toBe("MOCK");
  });

  it("does not activate Swiggy when provider is requested without complete config", () => {
    const config = getGroceryProviderConfig({
      GROCERY_PROVIDER: "swiggy_instamart",
      SWIGGY_BUILDERS_ENABLED: "true",
      SWIGGY_BUILDERS_CLIENT_ID: "client-id"
    });

    expect(config.activeProvider).toBe("MOCK");
    expect(config.mockMode).toBe(true);
    expect(config.swiggy.status).toBe("CONFIG_INCOMPLETE");
    expect(config.swiggy.missing).toEqual(["SWIGGY_BUILDERS_CLIENT_SECRET", "SWIGGY_BUILDERS_REDIRECT_URI"]);
  });

  it("only marks Swiggy selected when the explicit flag and placeholders are configured", () => {
    const config = getGroceryProviderConfig({
      GROCERY_PROVIDER: "swiggy_instamart",
      SWIGGY_BUILDERS_ENABLED: "true",
      SWIGGY_BUILDERS_CLIENT_ID: "client-id",
      SWIGGY_BUILDERS_CLIENT_SECRET: "client-secret",
      SWIGGY_BUILDERS_REDIRECT_URI: "http://localhost:3000/integrations/swiggy/callback"
    });

    expect(config.activeProvider).toBe("SWIGGY_INSTAMART");
    expect(config.swiggy.status).toBe("READY_FOR_STUB_ONLY");
  });

  it("Swiggy provider operations throw clear not-configured errors and make no external calls", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const provider = new SwiggyInstamartProvider();

    await expect(provider.searchProducts("milk", { householdId: "household-1" })).rejects.toThrow(SwiggyProviderNotConfiguredError);
    await expect(provider.prepareCart([], { householdId: "household-1" })).rejects.toThrow("Official Swiggy Builders Club access");
    await expect(provider.updateCart("cart-1", [])).rejects.toThrow("Operation: updateCart");
    await expect(provider.trackOrder("order-1")).rejects.toThrow("Operation: trackOrder");
    await expect(provider.placeOrder("cart-1", "")).rejects.toThrow("Explicit household admin approval is required before checkout.");
    await expect(provider.placeOrder("cart-1", "admin-approved")).rejects.toThrow("Operation: placeOrder");

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
