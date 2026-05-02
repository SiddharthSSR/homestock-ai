# HomeStock AI Architecture

HomeStock AI is a Next.js application for shared household grocery memory, request approval, and safe mock cart preparation. The architecture keeps memory and coordination independent from commerce providers so the app remains useful before Swiggy access exists.

## App Structure

Primary app routes:

- `/`: household dashboard with summary cards, reminders, running-low suggestions, and activity.
- `/add`: role-aware grocery request input. Cook actors see simplified helper mode.
- `/grocery`: grouped grocery request list.
- `/approve`: admin approval queue.
- `/cart`: mock cart draft review and cart approval.
- `/memory`: recurring grocery suggestions and memory controls.
- `/notifications`: generated in-app reminders.
- `/household`: household members, roles, and settings-oriented copy.
- `/more`: mobile-friendly navigation hub.
- `/integrations/swiggy`: Swiggy Builders Club readiness/status page.

Reusable UI lives in `components/`. Domain logic lives in `lib/`. API route handlers live under `app/api/`.

## Backend / API

The MVP uses Next.js route handlers for mutations and reads that need client-side interactivity.

Key API areas:

- household creation and members,
- grocery request creation/list/edit/status updates,
- grocery approval/rejection,
- mock cart preparation,
- cart item update/remove,
- cart approval,
- memory suggestions,
- memory suggestion dismissal/restore.

Server-side services enforce domain behavior and permission checks before mutating data.

## Data Model Overview

Prisma models include:

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
- `MemorySuggestionDismissal`
- `AuditLog`

Grocery requests preserve both:

- `rawText`: what the user entered,
- `canonicalName`: normalized item name for grouping, memory, and duplicate handling.

## Parser And Grocery Flow

The parser is deterministic and local.

It handles:

- comma-separated items,
- `and` separated items,
- basic quantity/unit extraction,
- common Hindi/Hinglish grocery terms,
- synonym normalization.

Flow:

1. User submits natural language text.
2. Parser extracts structured items.
3. Items are normalized to canonical grocery names.
4. Duplicate/synonym hints are generated where applicable.
5. Requests are saved as `PENDING`.
6. Admin approves/rejects.
7. Approved items can be converted into a mock cart draft.

## Role And Permission Model

Roles:

- `ADMIN`
- `MEMBER`
- `COOK`

`ADMIN` can approve requests, prepare carts, edit cart items, approve carts, and access settings controls.

`MEMBER` can add requests, view lists, view memory, and add memory suggestions to the grocery list.

`COOK` can add grocery requests through simplified helper mode and view basic submitted request state where supported.

The current app uses MVP/dev actor switching with `actorId`. Production authentication is not implemented yet.

## Memory Service

The memory service generates simple, explainable suggestions from household grocery activity.

Suggestion types:

- due soon,
- monthly staple,
- frequent item,
- preference.

Memory suggestions can be dismissed and restored. Dismissal is persisted by household and suggestion key.

The service avoids claiming learned behavior when history is insufficient; setup suggestions are labeled cautiously.

## Reminder Service

The reminder service generates in-app reminders from current household data.

Reminder types:

- pending approval,
- cart review,
- running low,
- cook request status.

Reminders are role-aware:

- admins see approval/cart/running-low reminders,
- members see running-low reminders,
- cooks see request-status reminders.

There are no external notifications or background jobs in the MVP.

## Provider Abstraction

`GroceryCommerceProvider` defines:

- `searchProducts`
- `prepareCart`
- `updateCart`
- `placeOrder`
- `trackOrder`

`MockGroceryProvider` is the active provider.

`SwiggyInstamartProvider` is a non-operational readiness stub. It throws explicit not-configured errors until official Builders Club access, credentials, and confirmed MCP schemas are available.

See [provider-architecture.md](provider-architecture.md).

## Seed Fixtures

`npm run prisma:seed` creates deterministic QA households:

- `QA Empty Household`
- `QA Starter Household`
- `QA Cart Household`
- `QA Memory Household`

These fixtures support empty states, request/approval flows, mock cart review, memory suggestions, reminders, and role testing.

See [dev-seed-data.md](dev-seed-data.md).

## Safety Boundaries

HomeStock AI is approval-first.

Current safety boundaries:

- no real checkout,
- no payment,
- no real Swiggy API calls,
- no scraping,
- no undocumented endpoints,
- no autonomous ordering,
- explicit admin approval required for cart approval,
- future checkout must require explicit admin approval.

Audit logs capture meaningful mutations for reviewability.
