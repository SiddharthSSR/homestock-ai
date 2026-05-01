# Dev Seed Data

HomeStock AI includes deterministic local seed fixtures for QA and manual testing. The fixtures are development-only data and do not introduce production auth, real checkout, or Swiggy behavior.

## Run The Seed

Start Postgres and apply migrations first:

```bash
docker compose up -d
npm run prisma:migrate
npm run prisma:seed
```

For a fully clean local database, use Prisma's reset command:

```bash
npx prisma migrate reset
```

`migrate reset` deletes local data. Use it only for local/dev QA.

## Idempotency

`npm run prisma:seed` deletes and recreates only the known QA fixture households:

- `QA Empty Household`
- `QA Starter Household`
- `QA Cart Household`
- `QA Memory Household`
- legacy `Demo Household`

Users, grocery catalog items, and grocery synonyms are upserted. Re-running the seed avoids duplicate fixture households, but household IDs can change because the fixture households are recreated.

## Fixture Households

### QA Empty Household

Purpose:
- Test empty `/grocery`, `/memory`, and `/cart` states.
- Confirm memory setup suggestions do not claim learned history.

Users:
- `Empty Admin` (`ADMIN`)

### QA Starter Household

Purpose:
- Test grocery add, list, approve, reject, role switching, and cook helper flows.

Users:
- `Starter Admin` (`ADMIN`)
- `Starter Member` (`MEMBER`)
- `Starter Cook` (`COOK`)

Seeded requests:
- Tomato, 1 kg, from Starter Cook, `PENDING`
- Onion, 2 kg, from Starter Cook, `PENDING`, high urgency
- Curd, 500 g, from Starter Member, `PENDING`
- Atta, 5 kg, from Starter Cook, `APPROVED`

### QA Cart Household

Purpose:
- Test mock cart review, edit/remove, approve, and provider messaging.

Users:
- `Cart Admin` (`ADMIN`)
- `Cart Member` (`MEMBER`)
- `Cart Cook` (`COOK`)

Seeded data:
- One `READY_FOR_APPROVAL` mock cart draft.
- Cart items include available, limited, and substituted examples.
- Extra approved requests for Milk and Eggs so QA can prepare another mock cart.

### QA Memory Household

Purpose:
- Test household memory suggestions and dashboard Running Low behavior.

Users:
- `Memory Admin` (`ADMIN`)
- `Memory Member` (`MEMBER`)
- `Memory Cook` (`COOK`)

Seeded history:
- Milk every 2-3 days.
- Eggs weekly.
- Atta monthly.
- Oil monthly.
- Coriander repeated with vegetable activity.

The fixture includes historical approved mock carts, recurring patterns, and grocery preferences for explainable memory output.

## Local MVP Actor Testing

HomeStock AI still uses an MVP/dev actor switcher, not production authentication. Use the household switcher and actor switcher in the UI to test role behavior.

The seed command logs each fixture household ID and admin actor ID:

```text
QA Starter Household: householdId=<id>, adminActorId=<id>
```

You can use those IDs in URLs when needed:

```text
/grocery?householdId=<householdId>&actorId=<actorId>
/approve?householdId=<householdId>&actorId=<actorId>
/cart?householdId=<householdId>&actorId=<actorId>
/memory?householdId=<householdId>&actorId=<actorId>
```

Prefer the in-app switchers for regular QA, because IDs are regenerated when fixture households are reseeded.
