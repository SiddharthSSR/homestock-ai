# Grocery Provider Architecture

HomeStock AI keeps household memory, approvals, and reminders independent from grocery commerce providers. The app must remain useful before Swiggy Builders Club access exists.

## Active Provider

The active provider is `MockGroceryProvider`.

Mock mode:

- uses a deterministic local grocery catalog,
- returns fake prices, availability, and substitutions,
- prepares cart drafts for review,
- does not place real orders,
- does not call Swiggy or any external commerce endpoint.

## Provider Interface

`GroceryCommerceProvider` defines the commerce boundary:

- `searchProducts`
- `prepareCart`
- `updateCart`
- `placeOrder`
- `trackOrder`

The interface mirrors the operations HomeStock AI needs while keeping provider-specific implementation details isolated.

## Swiggy Provider Stub

`SwiggyInstamartProvider` is present only as a future integration boundary. It throws explicit not-configured errors for all real operations.

The stub must not:

- scrape Swiggy,
- call undocumented endpoints,
- invent request or response schemas,
- imply live Swiggy price, inventory, availability, delivery time, or order status,
- place orders without explicit household admin approval.

## Safe Configuration

Local mock mode does not require Swiggy environment variables.

Relevant placeholders:

```env
GROCERY_PROVIDER="mock"
SWIGGY_BUILDERS_ENABLED="false"
SWIGGY_BUILDERS_CLIENT_ID=""
SWIGGY_BUILDERS_CLIENT_SECRET=""
SWIGGY_BUILDERS_REDIRECT_URI=""
```

Even if `GROCERY_PROVIDER` is set to `swiggy_instamart`, the config helper keeps the app in mock mode unless the explicit Swiggy flag and required placeholders are present. The provider is still a stub and does not make real calls.

## Future Integration Requirements

Before implementing Swiggy Instamart behavior:

1. Apply for official Swiggy Builders Club access.
2. Confirm Instamart MCP authentication.
3. Confirm exact callable tools, request schemas, response schemas, sandbox behavior, and rate limits.
4. Map provider methods to official MCP operations.
5. Add sandbox or approved-environment tests.
6. Keep explicit household admin approval before checkout.

