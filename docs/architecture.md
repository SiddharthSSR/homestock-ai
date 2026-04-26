# HomeStock AI Architecture

## System Architecture

The Phase 1 app is a Next.js TypeScript application with server-rendered pages, API route handlers, Prisma, and PostgreSQL. The product keeps memory and approval workflows independent from commerce providers so the app remains useful before Swiggy access exists.

Main layers:

- UI: `/household`, `/grocery`, and `/cart` pages with reusable components.
- API: route handlers for households, members, grocery requests, approvals, and carts.
- Domain services: grocery request creation, duplicate handling, cart preparation, and auditing.
- Parser: deterministic fallback parser with optional future LLM interface.
- Data: Prisma schema for users, households, grocery requests, preferences, carts, orders, recurring patterns, and audit logs.
- Commerce provider: `GroceryCommerceProvider` with `MockGroceryProvider` now and `SwiggyInstamartProvider` later.

## Data Model

Core entities:

- `User`
- `Household`
- `HouseholdMember`
- `GroceryItem`
- `GroceryRequest`
- `GrocerySynonym`
- `GroceryPreference`
- `CartDraft`
- `CartItem`
- `Order`
- `OrderItem`
- `RecurringPattern`
- `AuditLog`

The request model stores both `displayName` and `canonicalName`. This preserves what the user said while allowing duplicate detection and grouping.

## Provider Abstraction

`GroceryCommerceProvider` defines:

- `searchProducts(query, context)`
- `prepareCart(items)`
- `updateCart(cartId, updates)`
- `placeOrder(cartId, approvalToken)`
- `trackOrder(orderId)`

The mock provider returns deterministic fake products and prices. The Swiggy provider currently throws explicit not-configured errors and contains TODOs for official MCP wiring only after Builders Club access is granted.

## Agent / Parser Flow

1. Accept raw grocery text and metadata.
2. Use optional LLM parser when configured in the future.
3. Fall back to deterministic parsing:
   - remove request filler words,
   - split by commas and conjunctions,
   - extract quantity and unit,
   - singularize simple plurals,
   - normalize synonyms.
4. Match canonical names to categories and default units.
5. Detect existing pending requests in the household.
6. Merge quantities automatically when canonical name and unit are compatible; otherwise create a new pending request with notes.

## Approval Workflow

Grocery requests are created as `PENDING`.

Allowed admin actions:

- approve request: `PENDING` to `APPROVED`
- reject request: `PENDING` or `APPROVED` to `REJECTED`
- edit request fields
- mark purchased offline: any active request to `PURCHASED_OFFLINE`
- prepare cart from approved requests
- approve cart after review

Checkout/order placement is intentionally separate from cart approval and must require an explicit admin approval token in any future real provider.

## Security Considerations

- Phase 1 uses simple local actor IDs for MVP development; production should add real authentication.
- Role checks should be enforced server-side before production use.
- All provider checkout operations must require explicit admin approval.
- Swiggy must only be accessed through official Builders Club / MCP APIs.
- Do not scrape Swiggy, hardcode undocumented endpoints, or imply live price/availability when using mock data.
- Audit logs record actor, entity, action, and before/after state for sensitive workflows.
