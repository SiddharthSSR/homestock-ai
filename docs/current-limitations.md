# Current Limitations

HomeStock AI is an MVP intended for local product validation and demo workflows.

## Authentication

- The current actor selector is MVP/dev behavior.
- `actorId` query parameters are used for local role testing.
- This is not production authentication.
- Auth.js (NextAuth v5) scaffolding is in place behind a flag — see `docs/auth-readiness.md`. Phase 1 ships the schema, the `lib/auth/current-actor.ts` boundary helper, and a `/sign-in` page. Existing API routes do not enforce sessions yet.
- Until Phase 3 lands, every mutating API route still trusts `body.actorId` / `searchParams.actorId`. Treat the hosted demo as untrusted-by-design.
- `getDefaultActorId()` and `getDefaultHouseholdId()` in `lib/services/household-service.ts` are demo-only — they can silently mint a "Local Admin" user and a "My Household" if invoked in production. Hard-gating moves to Phase 3.
- Invitations, password reset, and account security remain future work.

## Commerce Provider

- The active provider is `MockGroceryProvider`.
- Prices, availability, substitutions, and cart totals are mock estimates.
- `SwiggyInstamartProvider` is a non-operational readiness stub.
- The app does not call real Swiggy APIs.
- The app does not scrape Swiggy.
- The app does not hardcode undocumented Swiggy endpoints.

## Checkout And Payment

- Real checkout is disabled.
- Payment is not implemented.
- Cart approval only marks a HomeStock cart draft as approved.
- No real grocery order can be placed from the current app.

## Notifications

- Reminders are generated in-app from current household data.
- There is no email, SMS, WhatsApp, or push notification delivery.
- Notification read/unread state and detailed preferences are not persistent yet.

## Memory

- Memory suggestions are simple and explainable.
- They are not complex ML predictions.
- Dismissed memory suggestions persist, but broader memory controls are still basic.

## Seed Data

- QA fixture households are deleted and recreated when `npm run prisma:seed` runs.
- Household IDs change after each seed run.
- Prefer the in-app household and actor switchers for demos.

## Deployment

- Hosted demo deployment is still demo mode, not production.
- Public demo data is mutable because production authentication is not implemented.
- `actorId` role switching remains demo-only.
- QA fixture households are deleted and recreated when seed runs, so hosted demo household IDs change after each reset.
- Hosted demos must keep the mock provider active and must not enable real checkout, payment, Swiggy API calls, or external notifications.
- Production authentication, monitoring, and operational hardening remain future work.

See [deployment.md](deployment.md) for hosted demo setup and safety checks.
