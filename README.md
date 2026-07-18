# BonsAI

**Grow Smarter. Eat Better.** — AI-powered plant-based meal planning, grocery planning, scanning, and nutrition.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Neon Auth + Neon Postgres
- Drizzle ORM
- Netlify hosting
- OpenAI (meal plans) + Stripe (billing)

## Local setup

```bash
cp .env.example .env
# Fill DATABASE_URL, NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET
npm install
npm run migrate
npm run dev
```

## Product roadmap

See `.taskmaster/docs/prd.txt` and `.taskmaster/tasks/tasks.json`.

| Phase | Focus |
| --- | --- |
| 1 | Foundation |
| 2 | Stripe billing (Checkout + portal + webhooks) |
| 3 | Profiles / onboarding |
| 4 | **AI Meal Planner (core)** |
| 5–10 | Grocery stretch, scanner, swaps, pantry AI, dashboards, launch |

## Database migrations

Files are in `netlify/database/migrations/`. **Neon Console will not list them.**

This site uses `DATABASE_URL` (plain Neon). Netlify Database auto-migrate only runs if that product is linked. So `npm run build` runs `scripts/migrate.mjs`, which applies pending SQL and records ids in `__bonsai_migrations`.

```bash
npm run migrate
```

See `netlify/database/migrations/README.md`.

## Deploy

Push to GitHub → Netlify builds (migrate + next build). Ensure env vars:

- `DATABASE_URL` or Netlify Database URL
- `NEON_AUTH_BASE_URL` (https://…neonauth…/auth — not postgresql://)
- `NEON_AUTH_COOKIE_SECRET`
- Optional: `OPENAI_API_KEY`, Stripe keys + price IDs

Add `https://jbonsai.netlify.app` under Neon Auth trusted domains.

Stripe webhook endpoint: `https://jbonsai.netlify.app/api/stripe/webhook`
