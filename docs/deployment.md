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

Seeding must not run automatically on every deployment. Migration deploy and seed are run manually against the hosted database using a one-shot inline `DATABASE_URL` (see below).

### 1. Pull production env vars from Vercel

```bash
vercel env pull .env.production.local --environment=production
```

`.env.production.local` contains secrets. It must not be committed (it is covered by the default Next.js gitignore). Delete it after you are done.

If your Vercel CLI is not on `PATH`, use `npx vercel@latest` in place of `vercel`.

### 2. Confirm the URL points to a hosted database

```bash
grep -E '^(DATABASE_URL|DIRECT_URL|POSTGRES_URL)' .env.production.local
```

The hostname must be a remote host (for example `*.neon.tech`, `*.supabase.co`, or `*.vercel-storage.com`). Stop if it points to `localhost` or `127.0.0.1`.

If your provider exposes both a pooled and a direct (non-pooled) URL (Neon, Supabase, Vercel Postgres), prefer the direct URL for migrations and the pooled URL for app runtime and seed. Common direct-URL variable names: `DIRECT_URL`, `POSTGRES_URL_NON_POOLING`, `DATABASE_URL_UNPOOLED`.

### 3. Run migration deploy with an inline `DATABASE_URL`

```bash
DATABASE_URL="$(grep -E '^(DIRECT_URL|POSTGRES_URL_NON_POOLING|DATABASE_URL)=' .env.production.local | head -1 | cut -d= -f2- | tr -d '\"')" \
  npx prisma migrate deploy
```

Never `export DATABASE_URL=...` for this work. Pass it inline on the same command line so the override dies with the process and a later `npm run prisma:*` cannot accidentally target the wrong database.

The `tr -d '\"'` step is required because `vercel env pull` writes values wrapped in double quotes; without stripping them Prisma fails with `P1012` (`the URL must start with the protocol postgresql://`).

If the direct endpoint is unreachable (for example `P1001` on a suspended Neon endpoint), fall back to the pooled `DATABASE_URL` for `migrate deploy`.

If you have an older local database that was created before migrations were committed, it may not have Prisma migration history. Do not reset it silently. Back up any local data you care about, or use a fresh database when validating migration deploy behavior.

## Hosted Demo Seed Data

Seed the hosted demo database manually after migrations, using the runtime (pooled) `DATABASE_URL`:

```bash
DATABASE_URL="$(grep '^DATABASE_URL=' .env.production.local | cut -d= -f2- | tr -d '\"')" \
  npx prisma db seed
```

Do not seed automatically on every deploy. Seeding is destructive for these known fixture households (members, requests, carts, audit logs, and the household rows themselves are deleted and recreated):

- `QA Empty Household`
- `QA Starter Household`
- `QA Cart Household`
- `QA Memory Household`
- `Demo Household`

Other households are not touched by the seed.

Household IDs change after each seed run. Use the in-app household and actor switchers for demos, or copy fresh IDs from seed output.

### 4. Cleanup

```bash
rm .env.production.local
```

Delete the pulled env file as soon as you are finished. Do not leave it on disk between sessions and do not commit it.

## Demo Reset Behavior

To reset the hosted demo:

1. Confirm you are targeting the hosted demo database, not production data.
2. Pull env vars (`vercel env pull .env.production.local --environment=production`).
3. Run `prisma migrate deploy` with an inline `DATABASE_URL` as shown above.
4. Run `prisma db seed` with an inline `DATABASE_URL` as shown above.
5. Open the hosted URL and verify the household switcher shows the QA households.
6. Run `rm .env.production.local`.

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
