# HomeStock AI

HomeStock AI is a shared household grocery memory and approval assistant. The Phase 1 MVP works with local household data, natural-language grocery parsing, synonym normalization, admin approvals, and a mock grocery commerce provider.

## Local Setup

1. Install dependencies: `npm install`.
2. Start local Postgres: `docker compose up -d`.
3. Generate Prisma client: `npm run prisma:generate`.
4. Create database tables: `npm run prisma:migrate -- --name init`.
5. Seed demo data and common synonyms: `npm run prisma:seed`.
6. Start the app: `npm run dev`.

The Swiggy Instamart integration is intentionally stubbed until official Builders Club access and tool documentation are available.
