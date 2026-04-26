# Phase 1 Implementation Plan

## 1. Folder Structure

- `app/`: Next.js pages and API routes.
- `components/`: reusable product UI components.
- `lib/grocery/`: parser, synonym normalization, and category rules.
- `lib/providers/`: commerce provider interface, mock provider, Swiggy stub.
- `lib/services/`: server-side domain services for groceries, carts, households, and audit logs.
- `prisma/`: Prisma schema and seed data.
- `docs/`: product, architecture, Swiggy, and implementation notes.

## 2. Database Schema

Use Prisma with PostgreSQL and explicit enums for roles, urgency, grocery request status, cart status, provider, and availability. Store raw user input alongside canonical grocery names to support explainability and duplicate detection.

## 3. API Routes

- `POST /api/households`
- `GET /api/households`
- `POST /api/households/:householdId/members`
- `POST /api/households/:householdId/grocery-requests`
- `GET /api/households/:householdId/grocery-requests`
- `PATCH /api/grocery-requests/:requestId`
- `POST /api/grocery-requests/:requestId/approve`
- `POST /api/grocery-requests/:requestId/reject`
- `POST /api/grocery-requests/:requestId/purchased-offline`
- `POST /api/households/:householdId/cart/prepare`
- `GET /api/households/:householdId/carts`
- `POST /api/carts/:cartId/approve`

## 4. UI Pages / Components

Pages:

- `/household`
- `/grocery`
- `/cart`

Components:

- `HouseholdSwitcher`
- `GroceryInputBox`
- `ParsedItemsPreview`
- `GroceryGroupedList`
- `GroceryItemCard`
- `AdminApprovalPanel`
- `CartDraftView`
- `CartApprovalPanel`
- `RecurringSuggestionsPanel`

## 5. Agent / Parser Design

Phase 1 uses a deterministic parser. It supports comma splitting, `and` splitting, common request filler words, quantity/unit extraction, simple plural cleanup, category assignment, and Hindi/Hinglish synonym normalization. The parser is isolated so an OpenAI-compatible LLM parser can be added later without changing API routes.

## 6. Mock Grocery Provider

The mock provider contains a small deterministic fake product catalog, pricing, availability, brands, and simple substitutions. It prepares cart drafts without any checkout side effects.

## 7. Approval Workflow

Requests start as `PENDING`, become `APPROVED` after admin action, move to `ADDED_TO_CART` when a mock cart draft is prepared, and the cart becomes `APPROVED` only after explicit admin approval. Real order placement is not enabled in Phase 1.

## 8. Testing Plan

- Unit test parser examples and synonym normalization.
- Unit test duplicate merge rules.
- API tests for request creation and status transitions.
- Provider tests for mock cart generation and unavailable items.
- Manual browser pass for `/household`, `/grocery`, and `/cart`.
