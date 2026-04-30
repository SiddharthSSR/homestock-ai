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

const catalog: Record<string, ProductSearchResult[]> = {
  atta: [{ productId: "mock-atta-5kg", productName: "Whole Wheat Atta", brand: "Aashirvaad", price: 285, unit: "5 kg", availabilityStatus: "AVAILABLE" }],
  curd: [{ productId: "mock-curd-400g", productName: "Fresh Curd", brand: "Milky Mist", price: 52, unit: "400 g", availabilityStatus: "AVAILABLE" }],
  tomato: [{ productId: "mock-tomato-1kg", productName: "Tomato", brand: "Fresh Produce", price: 42, unit: "1 kg", availabilityStatus: "AVAILABLE" }],
  onion: [{ productId: "mock-onion-1kg", productName: "Onion", brand: "Fresh Produce", price: 38, unit: "1 kg", availabilityStatus: "LIMITED" }],
  coriander: [{ productId: "mock-coriander-bunch", productName: "Coriander Leaves", brand: "Fresh Produce", price: 18, unit: "1 bunch", availabilityStatus: "AVAILABLE" }],
  oil: [{ productId: "mock-oil-1l", productName: "Sunflower Oil", brand: "Fortune", price: 165, unit: "1 litre", availabilityStatus: "AVAILABLE" }],
  milk: [{ productId: "mock-milk-1l", productName: "Toned Milk", brand: "Akshayakalpa", price: 76, unit: "1 litre", availabilityStatus: "AVAILABLE" }],
  eggs: [{ productId: "mock-eggs-30", productName: "Eggs", brand: "Farm Eggs", price: 245, unit: "30 pieces", availabilityStatus: "AVAILABLE" }],
  rice: [{ productId: "mock-rice-5kg", productName: "Sona Masoori Rice", brand: "India Gate", price: 430, unit: "5 kg", availabilityStatus: "AVAILABLE" }],
  potato: [{ productId: "mock-potato-1kg", productName: "Potato", brand: "Fresh Produce", price: 36, unit: "1 kg", availabilityStatus: "AVAILABLE" }],
  turmeric: [{ productId: "mock-haldi-100g", productName: "Turmeric Powder", brand: "Tata Sampann", price: 42, unit: "100 g", availabilityStatus: "AVAILABLE" }],
  cumin: [{ productId: "mock-jeera-100g", productName: "Cumin Seeds", brand: "Catch", price: 72, unit: "100 g", availabilityStatus: "AVAILABLE" }],
  salt: [{ productId: "mock-salt-1kg", productName: "Iodized Salt", brand: "Tata Salt", price: 28, unit: "1 kg", availabilityStatus: "AVAILABLE" }],
  sugar: [{ productId: "mock-sugar-1kg", productName: "Sugar", brand: "Madhur", price: 58, unit: "1 kg", availabilityStatus: "AVAILABLE" }]
};

export function calculateMockLineTotal(price: number, quantity: number | null | undefined) {
  return price * (quantity && quantity > 0 ? quantity : 1);
}

export class MockGroceryProvider implements GroceryCommerceProvider {
  async searchProducts(query: string, _context: SearchContext): Promise<ProductSearchResult[]> {
    return (
      catalog[query.toLowerCase()] ?? [
        {
          productId: `mock-${query.toLowerCase().replace(/\s+/g, "-")}`,
          productName: query,
          brand: "Mock Essentials",
          price: 99,
          unit: null,
          availabilityStatus: "SUBSTITUTED",
          substitutionReason: "No exact mock catalog match; showing a placeholder substitute."
        }
      ]
    );
  }

  async prepareCart(items: ApprovedGroceryItem[], context: SearchContext): Promise<ProviderCartDraft> {
    const cartItems = [];

    for (const item of items) {
      const [product] = await this.searchProducts(item.canonicalName, context);
      cartItems.push({
        ...product,
        groceryRequestId: item.requestId,
        quantity: item.quantity
      });
    }

    return {
      providerCartId: `mock-cart-${Date.now()}`,
      estimatedTotal: cartItems.reduce((total, item) => total + calculateMockLineTotal(item.price, item.quantity), 0),
      items: cartItems
    };
  }

  async updateCart(cartId: string, updates: CartUpdate[]): Promise<ProviderCartDraft> {
    return {
      providerCartId: cartId,
      estimatedTotal: updates.reduce((total, update) => total + update.quantity * 99, 0),
      items: []
    };
  }

  async placeOrder(_cartId: string, approvalToken: string): Promise<OrderResult> {
    if (!approvalToken) {
      throw new Error("Mock checkout requires an explicit approval token.");
    }

    throw new Error("MockGroceryProvider does not place real orders.");
  }

  async trackOrder(orderId: string): Promise<OrderTrackingResult> {
    return {
      orderId,
      status: "MOCK_PROVIDER_NO_REAL_TRACKING"
    };
  }
}
