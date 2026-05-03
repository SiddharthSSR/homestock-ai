# HomeStock AI Demo Script

This script is designed for a five-minute demo after running `npm run prisma:seed` locally, or after seeding a hosted demo database.

Use the in-app household switcher and MVP actor switcher. Household IDs change after each seed run, so avoid hardcoding URLs unless you copy the fresh IDs from the seed output.

For hosted demos, confirm the demo banner is visible. The hosted demo is mutable shared demo data, not production.

## Setup

Route: `/`

Expected:
- Warm household dashboard loads.
- Household switcher is visible on functional pages.
- MVP actor switcher shows the current local demo actor and role.
- If `NEXT_PUBLIC_DEMO_MODE=true`, the demo banner says mock provider only, no real checkout, no Swiggy API calls, and actor switching is demo-only.

Say:
> HomeStock AI is a shared grocery memory and approval assistant. It captures grocery requests from household members and cooks, normalizes them, routes them for approval, remembers recurring items, and prepares mock cart drafts without placing real orders.

## 1. Cook / Helper Request Flow

Household: `QA Starter Household`

Actor/role: `Starter Cook · COOK`

Route: `/add`

Steps:
1. Select `QA Starter Household`.
2. Select `Starter Cook · COOK`.
3. Confirm the simplified cook/helper request screen is shown.
4. Type:

   ```text
   Aata, tamatar, pyaaz, tel, dhaniya chahiye
   ```

5. Click `Review items` or `Send to household`, depending on the visible state.

Expected:
- Hinglish items are parsed and normalized.
- Requests are saved as `PENDING`.
- Copy makes clear requests go to the household for approval.
- No admin approval actions are visible for the cook.

Say:
> The cook does not need to understand the full app. They can type the groceries in simple Hinglish, and HomeStock structures the request for the household.

## 2. Admin Approval Flow

Household: `QA Starter Household`

Actor/role: `Starter Admin · ADMIN`

Route: `/approve`

Steps:
1. Switch actor to `Starter Admin · ADMIN`.
2. Open `/approve`.
3. Review pending grocery requests.
4. Approve one request.
5. Reject one request if you want to demonstrate control.
6. Use bulk approve if multiple pending items remain.

Expected:
- Admin sees approve/reject/bulk approval actions.
- Status changes are reflected on `/grocery`.
- The page states that no order is placed from approval.

Say:
> HomeStock is approval-first. Capturing a request is separate from approving it, and approving groceries is still separate from any cart or checkout.

## 3. Grocery List View

Household: `QA Starter Household`

Actor/role: `Starter Admin · ADMIN` or `Starter Member · MEMBER`

Route: `/grocery`

Steps:
1. Open `/grocery`.
2. Review grouped grocery requests.
3. Point out categories, requesters, urgency, statuses, and duplicate/synonym hints when present.

Expected:
- Items appear grouped by category.
- Status pills show pending/approved/rejected/cart states.
- Non-admin roles can view but do not get admin-only actions.

Say:
> This is the shared household memory list. Everyone sees the same structured grocery state instead of relying on scattered chat messages.

## 4. Mock Cart Flow

Household: `QA Cart Household`

Actor/role: `Cart Admin · ADMIN`

Route: `/cart`

Steps:
1. Select `QA Cart Household`.
2. Select `Cart Admin · ADMIN`.
3. Open `/cart`.
4. Review the existing mock cart draft.
5. Edit one item quantity if the draft is ready for approval.
6. Remove one item if you want to show request restoration.
7. Approve the cart.

Expected:
- Provider status says mock mode.
- Estimated prices and availability are clearly mock estimates.
- Approval marks the cart approved in HomeStock only.
- No checkout, payment, Swiggy account action, or order placement occurs.

Say:
> The provider abstraction lets us prepare a cart-like review experience now, while keeping real commerce disabled until official Swiggy access exists.

## 5. Memory Suggestions And Controls

Household: `QA Memory Household`

Actor/role: `Memory Member · MEMBER` or `Memory Admin · ADMIN`

Route: `/memory`

Steps:
1. Select `QA Memory Household`.
2. Open `/memory`.
3. Review due soon, monthly staple, frequent item, and preference sections.
4. Dismiss one suggestion.
5. Refresh or navigate away/back.
6. Restore the dismissed suggestion from the dismissed suggestions section.
7. Add one suggestion back to the grocery list.

Expected:
- Suggestions explain why they appear.
- Dismissal persists across refresh.
- Restore makes the suggestion eligible again.
- Add to list creates a `PENDING` grocery request.

Say:
> HomeStock remembers repeated household patterns but stays cautious. It suggests items; it does not secretly order them.

## 6. Notifications / Reminders

Household: `QA Starter Household`, `QA Cart Household`, or `QA Memory Household`

Actor/role:
- Admin: approval and cart reminders.
- Member: running-low reminders.
- Cook: submitted request status.

Route: `/notifications`

Steps:
1. Open `/notifications`.
2. Switch between Admin, Member, and Cook actors where useful.
3. Click a reminder action.

Expected:
- Admin sees pending approval and cart review reminders.
- Member sees running-low reminders.
- Cook sees request status updates.
- Reminder links preserve household and actor context.

Say:
> Reminders are generated in-app from current household data. There are no external notifications or background jobs in this MVP.

## 7. Swiggy Readiness Page

Route: `/integrations/swiggy`

Steps:
1. Open `/integrations/swiggy`.
2. Point out current provider, Swiggy status, and checkout status.
3. Review official docs links, future checklist, and compliance rules.

Expected:
- Current provider is mock.
- Swiggy status is not connected.
- Real checkout is disabled.
- The page explicitly says no real Swiggy order can be placed.

Say:
> Swiggy integration is intentionally readiness-only. Future work must use official Builders Club / MCP access. We do not scrape, invent endpoints, or imply live price or inventory.

## Demo Close

Suggested closing:
> The MVP proves the core loop: capture grocery intent, structure it, approve it, remember recurring needs, and prepare a safe mock cart. Real commerce is deliberately behind provider readiness and explicit admin approval.
