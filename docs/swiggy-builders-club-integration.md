# Swiggy Builders Club Integration Notes

## Official Public Docs

- Builders Club home: https://mcp.swiggy.com/builders
- Developers page: https://mcp.swiggy.com/builders/developers/
- Enterprises page: https://mcp.swiggy.com/builders/enterprises/

## Current HomeStock Status

HomeStock AI currently uses `MockGroceryProvider` for cart preparation and review. Swiggy is not connected, no Swiggy credentials are required for local development, and no real checkout or order placement is available.

The `SwiggyInstamartProvider` exists only as a non-operational integration stub. It throws explicit not-configured errors until official access, credentials, and confirmed MCP schemas are available.

## Confirmed From Public Docs

As of May 2, 2026, the public Builders Club pages state that Swiggy provides an MCP platform for developers and enterprises to build AI agents, apps, and integrations on Swiggy Food, Instamart, and Dineout APIs.

The public developers page lists three MCP servers:

- Swiggy Food
- Swiggy Instamart
- Swiggy Dineout

For this product, the relevant public Instamart capabilities are grocery product search, cart management, checkout, instant delivery tracking, and order retrieval. The public developers page names Instamart tool labels including `search_products`, `update_cart`, `get_cart`, `checkout`, `track_order`, and `get_orders`.

## Assumptions Until Access Is Granted

- Exact MCP authentication, request schemas, response schemas, rate limits, sandbox behavior, and production requirements are not available in this repo.
- Tool names visible on the public page are useful planning context, but implementation must verify exact callable tools after official access is granted.
- Price, inventory, delivery time, substitutions, and checkout constraints must come from official Swiggy MCP responses, not local guesses.
- OAuth or credential names in `.env.example` are placeholders only and may change after official documentation is granted.

## Instamart Features For HomeStock AI

- Product search for approved grocery requests.
- Cart draft creation and updates.
- Availability and substitution handling.
- Checkout only after explicit household admin approval.
- Order tracking and order history import for recurring pattern learning.

## Compliance Rules

- Use Swiggy only through official Builders Club / MCP APIs after access is granted.
- Do not scrape Swiggy.
- Do not hardcode undocumented Swiggy endpoints.
- Do not invent exact MCP request/response schemas before access.
- Do not misrepresent price, inventory, delivery time, availability, or branding.
- Clearly distinguish mock provider estimates from live Swiggy data.
- Always require explicit household admin approval before checkout/order placement.

## Why GroceryCommerceProvider Exists

HomeStock AI is memory-first and ordering-second. The provider abstraction keeps household memory, approvals, recurring suggestions, and audit logs useful even without Swiggy access. It also lets the app test cart preparation through `MockGroceryProvider` while isolating future Swiggy-specific behavior in `SwiggyInstamartProvider`.

## Future SwiggyInstamartProvider Implementation

After official Builders Club access is granted:

1. Confirm MCP server setup and authentication from official docs.
2. Map `searchProducts` to the official Instamart product search tool.
3. Map `prepareCart` and `updateCart` to official cart tools.
4. Require an admin approval token before invoking checkout.
5. Map `trackOrder` to official order tracking.
6. Persist external cart/order IDs without exposing secrets.
7. Add integration tests using official sandbox or approved test environment.

The current provider stub must remain non-operational until those steps are complete.

## Readiness Checklist

- Apply for Builders Club access.
- Confirm official Instamart MCP tools and schemas.
- Configure credentials through environment variables or approved secret storage.
- Keep `GroceryCommerceProvider` as the only commerce boundary.
- Add tests proving mock mode makes no external Swiggy calls.
- Keep admin approval before any checkout operation.
- Keep mock estimates clearly labeled until live Swiggy responses are available.

## Explicit Warning

Do not scrape Swiggy, do not call undocumented endpoints, and do not hardcode unofficial API behavior. Any production commerce action must go through official Swiggy Builders Club / Instamart MCP access.
