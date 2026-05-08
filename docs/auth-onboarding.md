# Auth Onboarding

HomeStock AI does not have a self-serve signup or invite flow. The only way to link a real authenticated user to a household today is the `scripts/link-user.ts` developer/admin script.

This is intentional: see `docs/auth-readiness.md` for the phased plan and the reasons we keep onboarding out-of-app.

For a fully scripted local end-to-end test of non-demo auth (sign-in, session, API enforcement) without any SMTP setup, see [docs/non-demo-auth-smoke.md](non-demo-auth-smoke.md). That runbook uses this script with `--create-household-if-missing` to provision a one-shot smoke environment.

## When to use this

- A first real human needs to sign in to a non-demo deployment.
- A household admin wants to grant access to a new household member after running the script.
- You want to update an existing member's role (ADMIN ↔ MEMBER ↔ COOK) without writing SQL.

Do not use this against a demo-mode database unless you are testing the script itself. Demo mode still uses `actorId` query switching and seeded QA households.

## Prerequisites

The script writes directly to the database. Make sure:

- The target household already exists. The script will not create households.
- For real sign-in to work after linking, the deployment has `AUTH_SECRET`, `EMAIL_SERVER` (Nodemailer SMTP DSN), and `EMAIL_FROM` set.
- You are running on a node version that matches the repo (see `.nvmrc` if present).
- You have a `DATABASE_URL` for the target environment.

## Running the script

The script reads `DATABASE_URL` from the environment. Always pass it inline on the same command line; never `export` it.

### Local development

```bash
DATABASE_URL="postgresql://homestock:homestock@localhost:5432/homestock_ai?schema=public" \
  npm run auth:link-user -- \
    --email me@example.com \
    --role ADMIN \
    --householdName "Family"
```

The `--` is required by npm to forward arguments. If you would rather run `tsx` directly:

```bash
DATABASE_URL="..." npx tsx scripts/link-user.ts --email me@example.com --role ADMIN --householdName "Family"
```

### Hosted (Neon, via Vercel)

Use the documented manual flow from `docs/deployment.md`:

```bash
vercel env pull .env.production.local --environment=production

DATABASE_URL="$(grep '^DATABASE_URL=' .env.production.local | cut -d= -f2- | tr -d '\"')" \
  npm run auth:link-user -- \
    --email me@example.com \
    --role ADMIN \
    --householdId hh_real_household_id

rm .env.production.local
```

`.env.production.local` contains secrets and is gitignored. Delete it as soon as you finish.

If the Neon endpoint is suspended, the first attempt may fail with `P1001`. Hit the deployed app once to wake the endpoint, then retry.

## Dry run

Always start with `--dry-run` against a new database. It prints what would be written without touching the DB:

```bash
DATABASE_URL="..." \
  npm run auth:link-user -- \
    --email me@example.com \
    --role ADMIN \
    --householdName "Family" \
    --dry-run
```

The output ends with `dry-run: no changes written.`

## Worked examples

ADMIN of an existing real household:

```bash
DATABASE_URL="..." npm run auth:link-user -- \
  --email admin@example.com --name "Real Admin" --role ADMIN --householdName "Family"
```

MEMBER of an existing household, by id:

```bash
DATABASE_URL="..." npm run auth:link-user -- \
  --email member@example.com --role MEMBER --householdId hh_abc
```

COOK helper:

```bash
DATABASE_URL="..." npm run auth:link-user -- \
  --email cook@example.com --role COOK --householdName "Family"
```

Promote an existing MEMBER to ADMIN — re-run the script with the new role:

```bash
DATABASE_URL="..." npm run auth:link-user -- \
  --email member@example.com --role ADMIN --householdName "Family"
```

The script upserts on `(householdId, userId)`, so re-running with a different role just updates membership.

## Safety guards

The script refuses to run if any of the following are true. Each has an explicit override flag.

| Guard | Triggered by | Override flag |
|---|---|---|
| Demo mode | `DEMO_MODE` or `NEXT_PUBLIC_DEMO_MODE` set to `"true"` | `--allow-demo` |
| Fixture household | Target name is `QA Empty/Starter/Cart/Memory Household` or `Demo Household` | `--allow-fixture` |
| Last admin demote | Target user is the only ADMIN and the new role is not ADMIN | `--allow-last-admin-demote` |

Why these guards exist:

- `--allow-demo`: writing into a demo DB is almost always a mistake. The next `npm run prisma:seed` resets fixture households and would silently delete your linked membership.
- `--allow-fixture`: same reason, even on non-demo databases. Fixture-named rows get reset by the seed.
- `--allow-last-admin-demote`: prevents accidentally locking everyone out of household management. If you really want zero ADMINs (e.g. before deleting the household), pass the flag.

## What the script does and does not do

Does:

- Lowercase the email before lookup (`Foo@Bar.com` and `foo@bar.com` resolve to the same row).
- Upsert `User` by email. Updates `name` only when `--name` is explicitly passed for an existing user.
- Default `--name` to the email local-part for new users (`me@example.com` → `me`).
- Upsert `HouseholdMember` on `(householdId, userId)`.
- Print a clean four-line summary: target user, household, membership state, sign-in hint.
- Run user and membership upserts inside one Prisma transaction.

Does not:

- Create households (will exit with a helpful error if `--householdId` or `--householdName` does not match anything).
- Delete users or memberships.
- Print `DATABASE_URL` or any secret. Only the host is logged.
- Send a magic-link email. Sign-in is initiated by the user via `/sign-in` after linking.
- Touch unrelated households or memberships.

## Known limitations

- No invite flow. The user does not receive an email until they go to `/sign-in` and request a magic link themselves.
- No self-serve onboarding UI. New members must be linked by someone with shell access to the database URL.
- Sign-in only works when the deployment has `AUTH_SECRET`, `EMAIL_SERVER`, and `EMAIL_FROM` set. Until then the script will still link the user, but `/sign-in` will show "auth not configured".
- Demo mode still uses `actorId`. The script is a no-op for the hosted demo experience.
- This is developer/admin tooling; it is not exposed in the app.

## Troubleshooting

`error: --email is required` — argv parsing failed. Run `npm run auth:link-user -- --help` for usage.

`error: household with id 'X' not found.` or `error: no household named 'X'.` — household must already exist; create it first via the seed or in-app demo flow.

`error: multiple households named 'X': hh_a, hh_b. Pass --householdId to disambiguate.` — names are not unique. Pass `--householdId`.

`error: P1001 Could not connect to ...` — Postgres unreachable. For Neon free tier, the endpoint may be cold-starting. Hit the deployed app once and retry.

`error: Refusing to run against a demo-mode database.` — you ran the script with `DEMO_MODE`/`NEXT_PUBLIC_DEMO_MODE=true`. Either unset those env vars or pass `--allow-demo`.
