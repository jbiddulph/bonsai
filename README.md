# Bonsai

Next.js app with **Neon Auth** (Managed Better Auth) for user authentication, ready to deploy on **Netlify** from GitHub.

## Stack

- [Next.js](https://nextjs.org/) (App Router)
- [Neon Auth](https://neon.com/docs/auth/overview) via `@neondatabase/auth` + `@neondatabase/auth-ui`
- [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver) (`@neondatabase/serverless`)
- [Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) hosting
- [Netlify Neon extension](https://app.netlify.com/extensions/neon) for the Postgres connection string

## Local setup

1. Copy env vars and fill them in:

```bash
cp .env.example .env.local
```

2. In the [Neon Console](https://console.neon.tech/):

   - Create a project (or use the one provisioned by the Netlify Neon extension).
   - Enable **Auth** (Managed Better Auth) and copy the **Auth URL** into `NEON_AUTH_BASE_URL`.
   - Copy a **pooled** connection string into `DATABASE_URL` (or rely on `NETLIFY_DATABASE_URL` after linking Netlify).

3. Generate a cookie secret:

```bash
openssl rand -base64 32
```

Put the result in `NEON_AUTH_COOKIE_SECRET` (32+ characters).

4. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated users are redirected to `/auth/sign-in`.

## Deploy to Netlify via GitHub

1. Push this repo to GitHub.

2. In [Netlify](https://app.netlify.com/), **Add new site → Import an existing project** and select the GitHub repo. Build settings are already in `netlify.toml` (`npm run build`, publish `.next`).

3. Install the [Neon extension](https://app.netlify.com/extensions/neon) on the site so Netlify injects `NETLIFY_DATABASE_URL`.

4. In **Site configuration → Environment variables**, also set:

   | Variable | Source |
   | --- | --- |
   | `NEON_AUTH_BASE_URL` | Neon Console → Auth |
   | `NEON_AUTH_COOKIE_SECRET` | `openssl rand -base64 32` |
   | `DATABASE_URL` | Optional if `NETLIFY_DATABASE_URL` is present; otherwise paste the Neon pooled URL |

5. In Neon Auth settings, add your Netlify site URL (and `http://localhost:3000` for local) under **Trusted domains**.

6. Trigger a deploy. After it finishes, open the site, sign up, and confirm you land on the home page with your session details.

## Project layout

| Path | Purpose |
| --- | --- |
| `lib/auth/server.ts` | Neon Auth server SDK (`handler`, `middleware`, `getSession`) |
| `lib/auth/client.ts` | Browser auth client |
| `lib/db.ts` | Neon SQL helper (`NETLIFY_DATABASE_URL` or `DATABASE_URL`) |
| `app/api/auth/[...path]/route.ts` | Auth API proxy |
| `app/auth/[path]/page.tsx` | Sign-in / sign-up UI |
| `app/account/[path]/page.tsx` | Account settings UI |
| `proxy.ts` | Protects `/` and `/account/*` |

## Notes

- Auth user tables live in the `neon_auth` schema inside your Neon database.
- Netlify detects Next.js automatically; you do not need to pin `@netlify/plugin-nextjs` unless you want a specific adapter version.
- Never commit `.env.local` or real secrets.
