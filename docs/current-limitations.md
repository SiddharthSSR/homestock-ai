# Current Limitations

HomeStock AI is an MVP intended for local product validation and demo workflows.

## Authentication

- The current actor selector is MVP/dev behavior.
- `actorId` query parameters are used for local role testing.
- This is not production authentication.
- Production auth, sessions, invitations, and account security remain future work.

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

- The repo is optimized for local development right now.
- Production deployment, managed database setup, and monitoring remain future work.
