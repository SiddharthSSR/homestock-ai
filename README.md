# HomeStock AI

HomeStock AI is a shared household grocery memory and approval assistant for families, flatmates, and homes with cooks/helpers.

It turns scattered grocery needs from conversations, notes, and Hinglish/Hindi-style requests into one structured household list. The app helps the household avoid forgotten groceries, duplicate requests, unclear ownership, and rushed small orders.

## Product Vision

HomeStock AI is a household grocery operating system:

- anyone can add grocery needs,
- cooks/helpers can submit simple requests,
- admins approve what should be bought,
- recurring household groceries are remembered,
- cart drafts are prepared only after approval,
- real ordering remains blocked until explicit admin action and official provider access.

## Current MVP Capabilities

- Warm editorial household dashboard.
- Household roles: `ADMIN`, `MEMBER`, `COOK`.
- MVP/dev actor switcher for local testing.
- Natural-language grocery request parsing.
- Hindi/Hinglish grocery normalization such as `dahi -> curd`, `pyaaz -> onion`, `dhaniya -> coriander`.
- Cook/helper mode for low-friction request submission.
- Grocery requests grouped by category and status.
- Admin approval/rejection workflow.
- Mock grocery cart preparation and cart approval.
- Household memory suggestions for recurring items.
- Persistent memory suggestion dismissal and restore.
- In-app reminders for approvals, cart review, running-low items, and cook request status.
- Deterministic local QA seed households.
- Swiggy Builders Club / Instamart provider readiness, with no real Swiggy calls enabled.

## Tech Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Prisma
- PostgreSQL
- Vitest
- Mock grocery commerce provider

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start local Postgres:

   ```bash
   docker compose up -d
   ```

3. Generate Prisma client:

   ```bash
   npm run prisma:generate
   ```

4. Create/update database tables:

   ```bash
   npm run prisma:migrate -- --name init
   ```

5. Seed demo data:

   ```bash
   npm run prisma:seed
   ```

6. Start the app:

   ```bash
   npm run dev
   ```

Open `http://localhost:3000`.

## Environment Variables

Copy `.env.example` to `.env` and update values as needed.

Required for local development:

```env
DATABASE_URL="postgresql://homestock:homestock@localhost:5432/homestock_ai?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Provider defaults:

```env
GROCERY_PROVIDER="mock"
SWIGGY_BUILDERS_ENABLED="false"
```

Swiggy placeholders are intentionally optional and unused in local mock mode:

```env
SWIGGY_BUILDERS_CLIENT_ID=""
SWIGGY_BUILDERS_CLIENT_SECRET=""
SWIGGY_BUILDERS_REDIRECT_URI=""
```

## Demo Households

`npm run prisma:seed` creates deterministic QA households. Household IDs are regenerated on each seed run, so prefer the in-app household and actor switchers during demos.

- `QA Empty Household`: empty state testing.
- `QA Starter Household`: cook/member request submission and admin approval.
- `QA Cart Household`: mock cart review, edit/remove, and approval.
- `QA Memory Household`: memory suggestions, dismissed suggestions, and reminders.

See [docs/dev-seed-data.md](docs/dev-seed-data.md) for fixture details.

## Demo Walkthrough

Use [docs/demo-script.md](docs/demo-script.md) for a five-minute product walkthrough covering:

- cook/helper grocery request flow,
- admin approval flow,
- mock cart review,
- household memory,
- in-app reminders,
- Swiggy readiness page.

## Testing

Run the standard validation suite:

```bash
npm run typecheck
npm run lint
npm run build
npx vitest run
npm run prisma:seed
```

## Swiggy Builders Club Readiness

Swiggy integration is not active.

HomeStock AI currently uses `MockGroceryProvider`. `SwiggyInstamartProvider` is a non-operational stub for future official Builders Club / Instamart MCP integration.

The app does not:

- call real Swiggy APIs,
- scrape Swiggy,
- hardcode undocumented endpoints,
- place real orders,
- process payment,
- imply live Swiggy price, inventory, delivery time, or availability.

Future Swiggy work must use official Builders Club / MCP access only. See:

- [docs/provider-architecture.md](docs/provider-architecture.md)
- [docs/swiggy-builders-club-integration.md](docs/swiggy-builders-club-integration.md)

## Current Limitations

See [docs/current-limitations.md](docs/current-limitations.md).

Key limitations:

- MVP actor switching is not production authentication.
- Grocery commerce is mock-only.
- No real checkout, payment, or Swiggy order placement exists.
- No email, SMS, WhatsApp, or push notifications.
- Seed household IDs change after reseeding.

## Roadmap

See [docs/roadmap.md](docs/roadmap.md).

Near-term priorities:

- production authentication,
- deployment hardening,
- persistent notification preferences/read state,
- official Swiggy integration after access,
- WhatsApp/Telegram or voice input for cooks/helpers,
- mobile/PWA polish.
