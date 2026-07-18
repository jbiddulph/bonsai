# BonsAI

**Grow Smarter. Eat Better.** — AI-powered plant-based meal planning, grocery planning, scanning, and nutrition.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Neon Auth + Neon Postgres
- Drizzle ORM
- Netlify hosting + Netlify Database migrations
- OpenAI + Stripe (upcoming)

## Local setup

```bash
cp .env.example .env
# Fill DATABASE_URL, NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET
npm install
npm run dev
```

## Product roadmap

See `.taskmaster/docs/prd.txt` and `.taskmaster/tasks/tasks.json`.

| Phase | Focus |
| --- | --- |
| 1 | Foundation (in progress) |
| 2 | Auth providers + Stripe |
| 3 | Profiles / onboarding |
| 4 | **AI Meal Planner (core)** |
| 5–10 | Grocery, scanner, swaps, pantry, dashboards, launch |

## Deploy

Push to GitHub → Netlify builds automatically. Ensure env vars:

- `DATABASE_URL` or Netlify Database URL
- `NEON_AUTH_BASE_URL` (https://…neonauth…/auth — not postgresql://)
- `NEON_AUTH_COOKIE_SECRET`

Add `https://jbonsai.netlify.app` under Neon Auth trusted domains.
