export type SearchContext = {
  householdId: string;
  location?: string | null;
  budgetRemaining?: number;
};

export type ApprovedGroceryItem = {
  requestId: string;
  canonicalName: string;
  displayName: string;
  quantity: number | null;
  unit: string | null;
  category: string;
};

export type ProductSearchResult = {
  productId: string;
  productName: string;
  brand: string;
  price: number;
  unit: string | null;
  availabilityStatus: "AVAILABLE" | "LIMITED" | "UNAVAILABLE" | "SUBSTITUTED";
  substitutionReason?: string;
};

export type ProviderCartItem = ProductSearchResult & {
  groceryRequestId: string;
  quantity: number | null;
};

export type ProviderCartDraft = {
  providerCartId: string;
  estimatedTotal: number;
  items: ProviderCartItem[];
};

export type CartUpdate = {
  productId: string;
  quantity: number;
};

export type OrderResult = {
  externalOrderId: string;
  status: string;
  totalAmount: number;
};

export type OrderTrackingResult = {
  orderId: string;
  status: string;
  etaMinutes?: number;
};

export interface GroceryCommerceProvider {
  searchProducts(query: string, context: SearchContext): Promise<ProductSearchResult[]>;
  prepareCart(items: ApprovedGroceryItem[], context: SearchContext): Promise<ProviderCartDraft>;
  updateCart(cartId: string, updates: CartUpdate[]): Promise<ProviderCartDraft>;
  placeOrder(cartId: string, approvalToken: string): Promise<OrderResult>;
  trackOrder(orderId: string): Promise<OrderTrackingResult>;
}
