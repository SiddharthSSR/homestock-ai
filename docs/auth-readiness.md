# Auth Readiness

HomeStock AI is moving from MVP `actorId` query-string switching to real authentication. This document covers Phase 1 only — the scaffolding is in place but no existing API route yet enforces sessions. Demo mode is unchanged.

## Why actorId is demo-only

`?actorId=...` and `?householdId=...` query parameters are how the demo lets QA testers "be" different household members without an account. Server-side, every API route currently trusts `body.actorId` or `searchParams.actorId` and runs the household role check against that user. This is fine for a hosted demo (anyone can already see the seeded data), but it cannot ship as a real product because any client could claim to be the household ADMIN by typing a different `actorId`.

## Recommended approach

Auth.js v5 (NextAuth) with the Prisma adapter, single magic-link email provider via Nodemailer/SMTP. See `docs/phase-1-implementation-plan.md` and the planning conversation for the comparison against Clerk, Supabase Auth, and Lucia.

Why Auth.js:

- Postgres + Prisma already in place; the adapter writes three new tables and zero rework.
- The `User` row stays the canonical identity, so existing permission checks (`assertHouseholdPermission`) keep working unchanged once `actorId` is replaced by `session.user.id`.
- OSS, no per-MAU billing, low vendor lock-in.
- Magic link avoids password storage and OAuth consent screens for an early-stage demo.

## Phase 1 scope (this PR)

What is in:

- `next-auth@beta` (v5) and `@auth/prisma-adapter` installed.
- Prisma schema gains `Account`, `Session`, `VerificationToken` models and `User.emailVerified`, `User.image`. One migration: `20260503120000_auth_readiness`.
- `lib/auth/config.ts` exports the configured NextAuth instance. The Nodemailer email provider is only registered when both `EMAIL_SERVER` and `EMAIL_FROM` are set, so missing env vars do not crash the build or the request path.
- `app/api/auth/[...nextauth]/route.ts` exposes the standard NextAuth endpoints.
- `lib/auth/current-actor.ts` defines `getCurrentActor(householdId, opts?)` and `requireCurrentActor(householdId, opts?)`. Demo mode delegates to the existing `resolveCurrentActorId` and tags the source as `"demo"`. Non-demo mode reads the session, validates `HouseholdMember`, and returns the session user (`source: "session"`). Client-supplied `actorId` is ignored in non-demo mode.
- `app/sign-in/page.tsx` is the magic-link entry point. In demo mode it shows a notice, not the form. If auth is unconfigured it explains how to configure it.
- Unit tests in `lib/auth/current-actor.test.ts` covering all four resolution branches.

What is **not** in:

- No existing API route is wired to `requireCurrentActor` yet — that's Phase 3.
- No invite flow, no admin onboarding UI, no household picker change.
- No Swiggy, no payments.
- No global middleware.

## Demo mode compatibility

`isDemoModeEnabled()` (in `lib/household-selection.ts`) is the single source of truth: it returns true if `DEMO_MODE === "true"` or `NEXT_PUBLIC_DEMO_MODE === "true"`. Everything in this PR gates on it:

- `getCurrentActor()` short-circuits to the existing `resolveCurrentActorId` path in demo mode and never calls Auth.js `auth()`.
- `/sign-in` shows a "demo mode" notice instead of the form.
- The hosted Vercel demo (`DEMO_MODE=true`, `NEXT_PUBLIC_DEMO_MODE=true`) is untouched. The demo banner, actor switcher, seeded QA households, and `?actorId=` URL behavior all continue to work exactly as before.

## Future Phase 2/3 enforcement plan

Phase 2 (UI gating): hide `CurrentActorSwitcher` and stop preserving `actorId` in `PreservedQueryLink` when not in demo mode; add sign-in/sign-out entry points to `AppShell`.

Phase 3 (API enforcement): replace `String(body.actorId || (await getDefaultActorId()))` in every mutating API route with `await requireCurrentActor(householdId)`. Add membership checks to household-scoped GET routes. Filter `GET /api/households` to the user's memberships in non-demo mode. Add an origin-check middleware for CSRF on state-changing methods.

Phase 4 (onboarding): a one-shot `scripts/link-user.ts` to upsert a `User` by email and create a `HouseholdMember` row. No invite UI in this branch.

Phase 5 (flip): a separate Vercel project (or environment) with `DEMO_MODE` and `NEXT_PUBLIC_DEMO_MODE` unset, `AUTH_SECRET` set, and SMTP credentials provided.

## Required future env vars

For non-demo deployments only. All optional in demo mode.

```env
AUTH_SECRET=""        # Required by Auth.js. Generate with `openssl rand -base64 32`.
AUTH_URL=""           # Public URL of the deployment (e.g. https://app.example.com).
EMAIL_SERVER=""       # Nodemailer SMTP connection string.
EMAIL_FROM=""         # The from address on magic-link emails.
```

If `EMAIL_SERVER` and `EMAIL_FROM` are missing, the email provider is not registered and `/sign-in` shows an "auth not configured" notice. This is the safe default for the current hosted demo.

## Current limitations that remain after Phase 1

- API routes still trust `body.actorId` and `searchParams.actorId`. Phase 3 closes this gap.
- `getDefaultActorId()` and `getDefaultHouseholdId()` in `lib/services/household-service.ts` can still auto-create a "Local Admin" user and a "My Household" if called outside demo mode. They are documented as demo-only here. Phase 3 will hard-gate them and call sites will be replaced with `requireCurrentActor`.
- No invite flow.
- No password reset (magic link covers the equivalent flow).
- No CSRF middleware on existing JSON APIs.
