# Non-Demo Auth Smoke

Local, repeatable end-to-end smoke test for HomeStock AI's non-demo authentication path. The goal is to prove that **session-based auth, household membership, and API enforcement all work** without spinning up real SMTP, a hosted DB, or a deployed environment.

This is **not** a production deployment guide. The dev-log magic-link mode used here is local-only.

## What this proves

After completing the runbook you have, on your local machine:

- Auth.js v5 magic-link sign-in working end-to-end against a fresh Postgres database.
- Phase 3 API enforcement working in the browser: client-supplied `actorId`, `requestedBy`, and `createdBy` are ignored; the session user is the only authority.
- The Phase 4 onboarding script linking a real-looking user to a household.
- The Phase 2 UI gating: actor switcher hidden, `actorId` stripped from links, sign-in/sign-out controls visible.

If any of these regress in a future PR, this runbook will surface the failure in a few minutes of clicking.

## Prereqs

- Postgres running locally (the existing setup at `localhost:5432` is fine).
- `openssl` for generating `AUTH_SECRET`.
- Node + npm. The repo already has `tsx` and `next` as dev deps.
- Optional: Docker, only if you want Mailpit instead of the dev-log path.

## 1. Create a fresh smoke database

Don't reuse the demo/QA database. Pick a dedicated name so the smoke is deterministic and the demo seed can't reset it.

```bash
psql -h localhost -U homestock postgres -c 'CREATE DATABASE homestock_ai_smoke;'
```

If you need to reset later: `psql -h localhost -U homestock postgres -c 'DROP DATABASE homestock_ai_smoke;'`.

## 2. Configure environment

Create `.env.local` (gitignored) at the repo root with these values. **Do not commit it.** Use a separate file from `.env` so demo defaults are not in scope.

```env
# Smoke database
DATABASE_URL="postgresql://homestock:homestock@localhost:5432/homestock_ai_smoke?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Force non-demo
DEMO_MODE="false"
NEXT_PUBLIC_DEMO_MODE="false"

# Auth.js
AUTH_SECRET="<run: openssl rand -base64 32>"
AUTH_URL="http://localhost:3000"
AUTH_DEV_LOG_MAGIC_LINK="true"

# Mock provider unchanged
GROCERY_PROVIDER="mock"
SWIGGY_BUILDERS_ENABLED="false"
```

Generate the secret:

```bash
openssl rand -base64 32
```

`AUTH_DEV_LOG_MAGIC_LINK="true"` makes Auth.js write the sign-in URL to the server stdout instead of trying to send mail. **This must remain unset on any deployed environment.**

## 3. Apply migrations

```bash
DATABASE_URL="postgresql://homestock:homestock@localhost:5432/homestock_ai_smoke?schema=public" \
  npx prisma migrate deploy
```

Expected output ends with `2 migrations found` and `Applying migration ...`. You should see two migrations applied (`20260502165000_init` and `20260503120000_auth_readiness`).

## 4. Create the smoke household and link a real user

One command creates the user, creates the household, and creates the ADMIN membership:

```bash
DATABASE_URL="postgresql://homestock:homestock@localhost:5432/homestock_ai_smoke?schema=public" \
  npm run auth:link-user -- \
    --email smoke@example.com \
    --role ADMIN \
    --householdName "Auth Smoke Household" \
    --create-household-if-missing
```

Expected output:

```
db host: localhost:5432

✓ linked smoke <smoke@example.com> to 'Auth Smoke Household'
  user        id=cm... (create)
  household   id=cm... (create)
  membership  role=ADMIN (new)
```

Re-running the same command is idempotent: user/household/membership are upserted, role stays ADMIN. Use `--dry-run` first if you want to inspect the plan.

The fixture-name guard still applies when creating: `--householdName "QA Memory Household" --create-household-if-missing` fails unless `--allow-fixture` is also passed. The smoke runbook uses `"Auth Smoke Household"` (not a fixture name) precisely so this guard never trips.

## 5. Run the app

```bash
npm run dev
```

Expected: server boots on `http://localhost:3000`. No `[auth]` logs yet.

## 6. Sign in

1. Open `http://localhost:3000/sign-in` in a browser.
   - **Expected:** the magic-link form (email field + "Send sign-in link" button). Not the demo notice. Not the "auth not configured" panel.
2. Enter `smoke@example.com` and submit.
3. In the dev server's terminal, look for a line like:
   ```
   [auth] magic-link for smoke@example.com: http://localhost:3000/api/auth/callback/nodemailer?callbackUrl=...&token=...&email=smoke%40example.com
   ```
   Copy the URL.
4. Paste the URL into the browser address bar and load it.
   - **Expected:** redirected to `/`. DevTools → Application → Cookies shows `authjs.session-token` set.

## 7. Verify the linked household renders

On `/`:

- **Expected:** the page header shows `Auth Smoke Household`.
- **Expected:** the AppShell shows `Signed in as smoke` and a `Sign out` button.
- **Expected:** there is **no** demo banner.
- **Expected:** there is **no** "MVP actor" switcher anywhere on the page (the `CurrentActorSwitcher` only renders in demo mode).
- **Expected:** the URL has no `actorId` query parameter, and clicking the nav links does not introduce one.

## 8. Verify API enforcement (browser DevTools)

With the smoke session active, open the Network tab and use `fetch` from the console.

**8a. Anonymous mutation rejected.**

Open a private/incognito window (no cookies) and run:

```js
fetch("http://localhost:3000/api/households/<smoke-household-id>/grocery-requests", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
  body: JSON.stringify({ rawText: "tomato" }),
}).then((r) => r.status);
```

- **Expected:** `401`.

**8b. Logged-in user, but for a household they are not a member of.**

Create a second household manually (you can drop into Prisma Studio: `DATABASE_URL=... npx prisma studio`), capture its id, then from the smoke session console:

```js
fetch("http://localhost:3000/api/households/<other-household-id>/grocery-requests", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
  body: JSON.stringify({ rawText: "tomato" }),
}).then((r) => r.status);
```

- **Expected:** `403`.

**8c. Spoofed `actorId` ignored.**

From the smoke session, hit your own household's endpoint with a `requestedBy` of a fake user id:

```js
fetch("http://localhost:3000/api/households/<smoke-household-id>/grocery-requests", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
  body: JSON.stringify({ rawText: "tomato", requestedBy: "user-i-am-not" }),
}).then((r) => r.json());
```

- **Expected:** `200`. Verify in Prisma Studio that the new `GroceryRequest` row's `requestedBy` is the smoke user's id, not `"user-i-am-not"`.

**8d. Origin guard.**

Same as 8c but drop the `Origin` header. (Browsers always send `Origin` on `POST`, so use `curl`.)

```bash
curl -i -X POST "http://localhost:3000/api/households/<smoke-household-id>/grocery-requests" \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=<paste from DevTools>" \
  -d '{"rawText":"tomato"}'
```

- **Expected:** `403` with the origin-mismatch error.

**8e. `/api/households` filtered to memberships.**

```js
fetch("http://localhost:3000/api/households").then((r) => r.json()).then((d) => d.households.map((h) => h.name));
```

- **Expected:** only `Auth Smoke Household`.

## 9. Sign out

Click `Sign out` in the AppShell.

- **Expected:** cookie cleared. `/` reverts to the "Sign in" link. `/sign-in` shows the magic-link form again.

## 10. Tear-down

```bash
psql -h localhost -U homestock postgres -c 'DROP DATABASE homestock_ai_smoke;'
```

Delete `.env.local` if you don't want to keep the smoke config around.

## Optional: Mailpit instead of dev-log

If you want to see the actual email body that would be sent:

```bash
docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit
```

Replace the `AUTH_DEV_LOG_MAGIC_LINK` line in `.env.local` with:

```env
EMAIL_SERVER="smtp://localhost:1025"
EMAIL_FROM="auth@homestock.local"
```

Sign-in submissions now arrive in Mailpit's web UI at `http://localhost:8025`. Click the magic-link from inside the Mailpit message to complete sign-in. Everything else in this runbook stays the same.

## Troubleshooting

**`/sign-in` shows "Auth not configured" instead of the form.**
`AUTH_SECRET` is unset, or neither `AUTH_DEV_LOG_MAGIC_LINK="true"` nor a real SMTP pair (`EMAIL_SERVER` + `EMAIL_FROM`) is set. Confirm `.env.local` is being read (Next.js loads it automatically; restart `npm run dev` after editing).

**Sign-in form submits but no `[auth]` line appears in the terminal.**
The `dev` process picked up an older `config.ts` build. Stop `npm run dev`, confirm the env file has `AUTH_DEV_LOG_MAGIC_LINK="true"`, restart.

**"You are signed in, but you are not linked to a household yet" empty state.**
You signed in as an email that has no `HouseholdMember` row. Re-run step 4 with the same email, or run with the matching email used at sign-in.

**`P3005` from `prisma migrate deploy`.**
You aimed the migration at a database that already has a schema but no `_prisma_migrations` table. Drop and recreate the smoke DB, or pick a fresh database name.
