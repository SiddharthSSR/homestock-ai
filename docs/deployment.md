# Deployment Readiness

HomeStock AI can be deployed as a hosted demo on Vercel. This is still demo mode, not production.

The hosted demo must keep these boundaries visible:

- MVP actor switching is demo-only.
- There is no production authentication.
- The grocery provider is mock-only.
- There is no real checkout or payment.
- There are no Swiggy API calls.
- There are no email, SMS, WhatsApp, or push notifications.

## Recommended Provider

Use Vercel for the Next.js app.

Recommended database options:

- Neon Postgres
- Vercel Marketplace Postgres
- Supabase Postgres
- Any managed PostgreSQL service with a Vercel-compatible connection string

The app cannot run as a useful hosted demo without PostgreSQL because household, grocery, cart, memory, reminder, and role data are persisted through Prisma.

## Environment Variables

Set these variables in the Vercel project.

Required:

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_APP_URL="https://your-demo-url.vercel.app"
GROCERY_PROVIDER="mock"
SWIGGY_BUILDERS_ENABLED="false"
DEMO_MODE="true"
NEXT_PUBLIC_DEMO_MODE="true"
```

Optional future Swiggy placeholders:

```env
SWIGGY_BUILDERS_CLIENT_ID=""
SWIGGY_BUILDERS_CLIENT_SECRET=""
SWIGGY_BUILDERS_REDIRECT_URI=""
```

Swiggy placeholders are optional and unused in mock mode. Do not configure them for the hosted demo unless official Builders Club access and approved implementation work exist.

## Build Command

Use the default Vercel install command.

Recommended build command:

```bash
npm run vercel-build
```

This runs:

```bash
prisma generate && next build
```

The app should not run seeds during every build.

## Prisma Migration

The repo includes an initial Prisma migration under `prisma/migrations`.

For a hosted database, run:

```bash
npm run prisma:deploy
```

If using Vercel CLI environment injection, run:

```bash
vercel env run -e production -- npm run prisma:deploy
```

The exact environment name may vary depending on your Vercel setup. Use `production`, `preview`, or a custom environment name that matches the target database.

If you have an older local database that was created before migrations were committed, it may not have Prisma migration history. Do not reset it silently. Back up any local data you care about, or use a fresh database when validating migration deploy behavior.

## Hosted Demo Seed Data

Seed the hosted demo database manually after migrations:

```bash
vercel env run -e production -- npm run prisma:seed
```

The exact environment name may vary.

Do not seed automatically on every deploy. Seeding deletes and recreates known QA fixture households:

- `QA Empty Household`
- `QA Starter Household`
- `QA Cart Household`
- `QA Memory Household`
- `Demo Household`

Arbitrary older local or hosted households are not deleted unless their names match the known fixtures.

Household IDs change after each seed run. Use the in-app household and actor switchers for demos, or copy fresh IDs from seed output.

## Demo Reset Behavior

To reset the hosted demo:

1. Confirm you are targeting the hosted demo database, not production data.
2. Run `npm run prisma:deploy`.
3. Run `npm run prisma:seed`.
4. Open the hosted URL and verify the household switcher shows the QA households.

Do not run destructive database reset commands against a shared demo database unless the reset is intentional and communicated.

## Safety Checklist

Before sharing a hosted demo URL, confirm:

- `NEXT_PUBLIC_DEMO_MODE=true`
- `DEMO_MODE=true`
- `GROCERY_PROVIDER=mock`
- `SWIGGY_BUILDERS_ENABLED=false`
- `/integrations/swiggy` says Swiggy is not connected
- `/cart` says real checkout is disabled
- `/approve` says no order is placed from the page
- actor switching is labeled as MVP/demo behavior
- hosted seed households are present
- no Swiggy credentials are required for the app to run

## Verification Checklist

Run locally before deploying:

```bash
npm run typecheck
npm run lint
npm run build
npx vitest run
npx prisma validate
```

After deployment:

1. Open the hosted URL.
2. Confirm the demo banner appears.
3. Confirm household and actor switchers work.
4. Follow `docs/demo-script.md`.
5. Confirm mock cart flow does not imply real checkout.
6. Confirm Swiggy integration page remains disconnected.

## Known Hosted Demo Limitations

- Public demo data is mutable.
- There is no production authentication.
- Actor switching is for demo exploration only.
- Demo seed resets change household IDs.
- No real grocery order can be placed.
- No external notifications are sent.
- Swiggy integration is readiness-only.
