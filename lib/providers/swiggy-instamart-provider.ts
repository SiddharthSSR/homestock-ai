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

export class SwiggyInstamartProvider implements GroceryCommerceProvider {
  async searchProducts(_query: string, _context: SearchContext): Promise<ProductSearchResult[]> {
    // TODO: Wire to official Swiggy Builders Club Instamart MCP product search after access is granted.
    // See docs/swiggy-builders-club-integration.md. Do not hardcode undocumented endpoints.
    throw new Error("Swiggy Instamart MCP access is not configured.");
  }

  async prepareCart(_items: ApprovedGroceryItem[], _context: SearchContext): Promise<ProviderCartDraft> {
    // TODO: Use official Instamart MCP cart tools after schemas and credentials are confirmed.
    throw new Error("Swiggy Instamart cart preparation is not configured.");
  }

  async updateCart(_cartId: string, _updates: CartUpdate[]): Promise<ProviderCartDraft> {
    // TODO: Use official Instamart MCP cart update tool after access is granted.
    throw new Error("Swiggy Instamart cart updates are not configured.");
  }

  async placeOrder(_cartId: string, approvalToken: string): Promise<OrderResult> {
    if (!approvalToken) {
      throw new Error("Explicit household admin approval is required before checkout.");
    }

    // TODO: Invoke official Instamart MCP checkout only after admin approval and official access.
    throw new Error("Swiggy Instamart checkout is not configured.");
  }

  async trackOrder(_orderId: string): Promise<OrderTrackingResult> {
    // TODO: Use official Instamart MCP tracking tool after access is granted.
    throw new Error("Swiggy Instamart order tracking is not configured.");
  }
}
