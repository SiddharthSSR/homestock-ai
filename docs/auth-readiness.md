# Auth Readiness

HomeStock AI is moving from MVP `actorId` query-string switching to real authentication. Phases 1 through 6 are now complete: Auth.js scaffolding exists, non-demo UI no longer exposes demo actor switching, API routes no longer trust client-provided `actorId` outside demo mode, developer/admin onboarding tooling exists for linking the first real user to an existing household, the entire non-demo auth path can be smoke-tested locally without real SMTP, and Resend is wired up as the recommended production email provider. Demo mode is unchanged.

## Why actorId is demo-only

`?actorId=...` and `?householdId=...` query parameters are how the demo lets QA testers "be" different household members without an account. In demo mode, API routes still honor those fields so seeded QA flows keep working. Outside demo mode, API routes ignore client-provided `actorId`, `requestedBy`, and `createdBy`; the current actor comes from the Auth.js session and the household membership row.

## Phase 6 scope (Resend email provider)

Phase 6 wires Auth.js's Resend provider as the recommended production email path and replaces the inline provider-selection code with a deterministic priority helper.

In:

- `next-auth/providers/resend` registered when `AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM`, and `AUTH_SECRET` are set.
- New env vars: `AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM`. Sender address is never hardcoded.
- `lib/auth/readiness.ts` exposes a `provider: "resend" | "smtp" | "dev-log" | "none"` field plus `unsafeProductionDevLog: boolean`. `authReadinessStatus()` returns the same shape from the live module.
- Provider priority (non-demo only):
  1. Resend (`AUTH_RESEND_KEY` + `AUTH_EMAIL_FROM` + `AUTH_SECRET`).
  2. Dev-log (`AUTH_DEV_LOG_MAGIC_LINK="true"` + `AUTH_SECRET` + `NODE_ENV !== "production"`).
  3. SMTP (`EMAIL_SERVER` + `EMAIL_FROM` + `AUTH_SECRET`) — kept as a fallback for legacy/local Mailpit setups.
  4. None.
- Production safety: when `AUTH_DEV_LOG_MAGIC_LINK=true` is detected with `NODE_ENV=production`, the dev-log provider is hard-disabled and `unsafeProductionDevLog` is set. `/sign-in` shows an "Unsafe configuration" panel and hides the form until the operator removes the flag.
- `/sign-in` shows a "Provider: resend|dev-log|smtp" line and explicit dev-log mode copy when active.

Out:

- No production rollout. Phase 6 ships the wiring; the deployment flip itself is still future work.
- No invite flow.
- No schema changes.
- No changes to API enforcement.

## Phase 5 scope (non-demo auth smoke)

Phase 5 makes non-demo auth runnable on a developer's laptop without standing up SMTP, Mailpit, or a real email provider. The full runbook is in `docs/non-demo-auth-smoke.md`.

In:

- `lib/auth/readiness.ts` — pure `computeAuthReadiness(env, demoMode)` helper. Same shape as the previous inline check, plus a new `devLog: boolean` field. Used by `lib/auth/config.ts` and unit tests.
- `lib/auth/config.ts` — registers the Nodemailer provider when **either** `EMAIL_SERVER`+`EMAIL_FROM` are set **or** `AUTH_DEV_LOG_MAGIC_LINK="true"`. In dev-log mode the provider is constructed with placeholder server config and `sendVerificationRequest` overridden to write the sign-in URL to stdout.
- `scripts/lib/link-user-helpers.ts` and `scripts/link-user.ts` gain `--create-household-if-missing`. Only valid with `--householdName`. Off by default. Off in `--dry-run` (the dry-run output marks the household line as "would create").
- New runbook `docs/non-demo-auth-smoke.md` with a checklist that exercises sign-in, AppShell auth controls, the Phase 4 empty state, and the Phase 3 enforcement matrix (401, 403, ignored `requestedBy`, origin guard, `/api/households` filtering).

Out:

- No production email provider, no Resend integration.
- No deployment of non-demo to Vercel.
- No invite UI, no signup UI.
- No schema changes.
- No changes to `lib/auth/api-auth.ts` (Phase 3 enforcement is reused as-is).

`AUTH_DEV_LOG_MAGIC_LINK` is local-only and must remain unset in any deployed environment. The runbook reinforces this.

## Phase 4 scope (onboarding tooling)

Phase 4 ships a single developer/admin script and the matching docs. No UI.

In:

- `scripts/link-user.ts` — upserts a `User` by email and a `HouseholdMember` on `(householdId, userId)` inside one Prisma transaction. Lowercases email, defaults `--name` to the email local-part for new users, leaves `name` untouched for existing users unless `--name` is passed explicitly.
- npm script alias `auth:link-user`. Pass arguments after `--` (e.g. `npm run auth:link-user -- --email me@example.com --role ADMIN --householdName "Family"`).
- Three opt-in safety guards: `--allow-demo`, `--allow-fixture`, `--allow-last-admin-demote`.
- `--dry-run` for plan-only inspection.
- New runbook: `docs/auth-onboarding.md`.
- Optional non-demo "no household membership yet" empty state on the homepage when a signed-in user has zero memberships. Tells the user to ask an admin or run `npm run auth:link-user`.

Out:

- No invite UI. No email send on link.
- No household creation. The script errors if the target does not exist.
- No flip to non-demo on the hosted Vercel project.

## Phase 3 scope (API enforcement)

Phase 3 wires the API layer to `requireCurrentActor`.

In:

- Centralized API auth handling in `lib/auth/api-auth.ts`.
- Non-demo API mutations ignore `body.actorId`, `body.requestedBy`, and `body.createdBy`.
- Household-scoped API routes call `requireCurrentActor(householdId)`.
- Entity-scoped routes first resolve the parent household:
  - `GroceryRequest -> householdId`
  - `CartDraft -> householdId`
  - `CartItem -> CartDraft -> householdId`
- `GET /api/households` returns all households in demo mode, but only session memberships in non-demo mode.
- Household-scoped GET routes now require membership in non-demo mode.
- Mutating API routes include a lightweight same-origin guard for `POST`, `PATCH`, and `DELETE`.
- Auth and permission failures return JSON responses:
  - `401` when no session exists,
  - `403` when the user is not a household member, lacks role permission, or sends an invalid origin,
  - `400` for missing household context,
  - `404` for missing parent entities.

Out:

- No invite flow.
- No production onboarding flow.
- No link-user script.
- No deployment flip to non-demo mode.
- No Swiggy, checkout, payment, or notification changes.

## Recommended approach

Auth.js v5 (NextAuth) with the Prisma adapter, single magic-link email provider via Nodemailer/SMTP. See `docs/phase-1-implementation-plan.md` and the planning conversation for the comparison against Clerk, Supabase Auth, and Lucia.

Why Auth.js:

- Postgres + Prisma already in place; the adapter writes three new tables and zero rework.
- The `User` row stays the canonical identity, so existing permission checks (`assertHouseholdPermission`) keep working unchanged once `actorId` is replaced by `session.user.id`.
- OSS, no per-MAU billing, low vendor lock-in.
- Magic link avoids password storage and OAuth consent screens for an early-stage demo.

## Phase 2 scope (UI gating cleanup)

Phase 2 ships UI-only changes that prepare the app for non-demo deployments. No API authorization changes.

In:

- `CurrentActorSwitcher` returns `null` in non-demo mode. The component-level gate covers all eight pages that render it (`app/page.tsx`, `app/household/page.tsx`, `app/grocery/page.tsx`, `app/approve/page.tsx`, `app/cart/page.tsx`, `app/memory/page.tsx`, `app/notifications/page.tsx`, `app/add/page.tsx`).
- `PreservedQueryLink` no longer carries `actorId` through navigation in non-demo mode. The gate uses a new pure helper `selectPreservedParams` (in `lib/navigation.ts`) so the rule is unit-testable. `householdId` is still preserved in both modes — users may belong to multiple households.
- `AppShell` shows a "Sign in" link when in non-demo mode without a session, and a "Signed in as {name}" indicator + sign-out button when a session exists. Demo mode keeps the existing demo banner and shows neither.
- `app/household/page.tsx` no longer renders the `actorId` hidden input or the household-create / add-member forms outside demo mode. Those forms still target unmigrated APIs that trust client `actorId`; hiding them in non-demo avoids silently using the demo fallback admin identity. A short notice replaces them: "auth enforcement coming in Phase 3".

Out:

- Production onboarding, invitations, and account linking remain future work.

## Phase 1 scope

What is in:

- `next-auth@beta` (v5) and `@auth/prisma-adapter` installed.
- Prisma schema gains `Account`, `Session`, `VerificationToken` models and `User.emailVerified`, `User.image`. One migration: `20260503120000_auth_readiness`.
- `lib/auth/config.ts` exports the configured NextAuth instance. The Nodemailer email provider is only registered when both `EMAIL_SERVER` and `EMAIL_FROM` are set, so missing env vars do not crash the build or the request path.
- `app/api/auth/[...nextauth]/route.ts` exposes the standard NextAuth endpoints.
- `lib/auth/current-actor.ts` defines `getCurrentActor(householdId, opts?)` and `requireCurrentActor(householdId, opts?)`. Demo mode delegates to the existing `resolveCurrentActorId` and tags the source as `"demo"`. Non-demo mode reads the session, validates `HouseholdMember`, and returns the session user (`source: "session"`). Client-supplied `actorId` is ignored in non-demo mode.
- `app/sign-in/page.tsx` is the magic-link entry point. In demo mode it shows a notice, not the form. If auth is unconfigured it explains how to configure it.
- Unit tests in `lib/auth/current-actor.test.ts` covering all four resolution branches.

What is **not** in:

- No invite flow, no admin onboarding UI, no household picker change.
- No Swiggy, no payments.
- No global middleware.

## Demo mode compatibility

`isDemoModeEnabled()` (in `lib/household-selection.ts`) is the single source of truth: it returns true if `DEMO_MODE === "true"` or `NEXT_PUBLIC_DEMO_MODE === "true"`. Everything in this PR gates on it:

- `getCurrentActor()` short-circuits to the existing `resolveCurrentActorId` path in demo mode and never calls Auth.js `auth()`.
- `/sign-in` shows a "demo mode" notice instead of the form.
- The hosted Vercel demo (`DEMO_MODE=true`, `NEXT_PUBLIC_DEMO_MODE=true`) is untouched. The demo banner, actor switcher, seeded QA households, and `?actorId=` URL behavior all continue to work exactly as before.

## Remaining future phases

Phase 4 (onboarding): a one-shot `scripts/link-user.ts` or equivalent admin-only onboarding flow to upsert a `User` by email and create a `HouseholdMember` row. No invite UI in the API enforcement branch.

Phase 5 (flip): a separate Vercel project or environment with `DEMO_MODE` and `NEXT_PUBLIC_DEMO_MODE` unset, `AUTH_SECRET` set, SMTP credentials provided, and real household memberships created.

## Required future env vars

For non-demo deployments only. All optional in demo mode.

```env
AUTH_SECRET=""           # Required by Auth.js. Generate with `openssl rand -base64 32`.
AUTH_URL=""              # Public URL of the deployment (e.g. https://app.example.com).
AUTH_RESEND_KEY=""       # Resend API key (recommended). Required for the Resend provider.
AUTH_EMAIL_FROM=""       # Sender for magic-link emails (e.g. "HomeStock <auth@homestock.app>").

# Legacy / fallback only. Used when Resend is not configured.
EMAIL_SERVER=""          # Nodemailer SMTP DSN.
EMAIL_FROM=""            # SMTP sender.
```

If neither Resend nor SMTP nor dev-log is configured, no email provider is registered and `/sign-in` shows an "auth not configured" notice. This is the safe default for the current hosted demo.

## Current limitations that remain after Phase 3

- Demo mode still intentionally trusts `actorId` to support hosted QA/demo exploration.
- `getDefaultActorId()` and `getDefaultHouseholdId()` in `lib/services/household-service.ts` remain demo utilities. API enforcement routes no longer use them in non-demo auth paths.
- No invite flow.
- No password reset (magic link covers the equivalent flow).
- The same-origin guard is intentionally lightweight and route-local; there is no global CSRF middleware yet.
