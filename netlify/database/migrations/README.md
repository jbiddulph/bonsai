# Database migrations

These SQL files live at `netlify/database/migrations/`.

## Why you might not “see” them

1. **Neon Console** does not list Netlify/app migrations. Neon’s UI shows tables/branches, not this folder’s history.
2. **Netlify Database auto-migrate** only runs when the **Netlify Database** product is linked to the site. This project currently uses `DATABASE_URL` (plain Neon), so Netlify will **not** auto-apply these on deploy by itself.
3. Phase 1 tables were also applied once via a manual script during development.

## How migrations run now

`npm run build` runs `node scripts/migrate.mjs` first.

That script:

- Creates `public.__bonsai_migrations`
- Applies any new `netlify/database/migrations/*` files in order
- Skips already-applied ids (and ignores “already exists” for types/tables)

## Current migrations

| Id | Purpose |
| --- | --- |
| `20260718170729_create_planets` | Netlify DB demo (dropped later) |
| `20260718170730_seed_planets` | Demo seed |
| `20260718191200_bonsai_foundation` | BonsAI core tables (profiles, meal_plans, …) |
| `20260718193000_billing_and_plans` | Billing helpers / plan indexes (Phase 2/4) |

## Local apply

```bash
npm run migrate
```
