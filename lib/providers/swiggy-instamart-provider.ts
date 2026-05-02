import type {
  ApprovedGroceryItem,
  CartUpdate,
  GroceryCommerceProvider,
  OrderResult,
  OrderTrackingResult,
  ProductSearchResult,
  ProviderCartDraft,
  SearchContext
} from "./types";

const NOT_CONFIGURED_MESSAGE =
  "Swiggy Instamart is not connected. Official Swiggy Builders Club access, credentials, and confirmed MCP schemas are required before this operation can run.";

export class SwiggyProviderNotConfiguredError extends Error {
  constructor(operation: string) {
    super(`${NOT_CONFIGURED_MESSAGE} Operation: ${operation}.`);
    this.name = "SwiggyProviderNotConfiguredError";
  }
}

export class SwiggyInstamartProvider implements GroceryCommerceProvider {
  async searchProducts(_query: string, _context: SearchContext): Promise<ProductSearchResult[]> {
    // TODO: Wire to official Swiggy Builders Club Instamart MCP product search after access is granted.
    // See docs/swiggy-builders-club-integration.md and do not hardcode undocumented endpoints or schemas.
    throw new SwiggyProviderNotConfiguredError("searchProducts");
  }

  async prepareCart(_items: ApprovedGroceryItem[], _context: SearchContext): Promise<ProviderCartDraft> {
    // TODO: Use official Instamart MCP cart tools after schemas and credentials are confirmed.
    throw new SwiggyProviderNotConfiguredError("prepareCart");
  }

  async updateCart(_cartId: string, _updates: CartUpdate[]): Promise<ProviderCartDraft> {
    // TODO: Use official Instamart MCP cart update tool after access is granted.
    throw new SwiggyProviderNotConfiguredError("updateCart");
  }

  async placeOrder(_cartId: string, approvalToken: string): Promise<OrderResult> {
    if (!approvalToken) {
      throw new Error("Explicit household admin approval is required before checkout.");
    }

    // TODO: Invoke official Instamart MCP checkout only after admin approval and official access.
    throw new SwiggyProviderNotConfiguredError("placeOrder");
  }

  async trackOrder(_orderId: string): Promise<OrderTrackingResult> {
    // TODO: Use official Instamart MCP tracking tool after access is granted.
    throw new SwiggyProviderNotConfiguredError("trackOrder");
  }
}
