# Reto 33

A clean, Apple-style **habit challenge** PWA. Pick a habit, mark each day on a
circular tracker, build it in 33 days. Sign in with an email code (OTP) — anyone
can register and try it. Installable on your phone as a web app.

Built with Next.js (App Router) + better-auth (email OTP) + SQLite.

## Features

- **Email OTP sign-in** — no passwords. First code for a new email creates the account.
- **33-day circular tracker** — tap "mark today" or tap any day on the ring.
- **Multiple challenges** — each with tangible / intangible / grand rewards.
- **Apple-style UI** — system font, light & dark, safe-area aware.
- **Installable PWA** — add to Home Screen, runs standalone.

## OTP modes

Set `OTP_DELIVERY`:

- `demo` (default) — the code is shown on the sign-in screen. Zero setup; great
  for trying it out. **Not for real public use** (it reveals the code).
- `resend` — sends real emails via [Resend](https://resend.com). Set
  `RESEND_API_KEY` and `EMAIL_FROM`. Switch to this before sharing publicly.

## Local dev

```bash
cp .env.example .env     # APP_URL=http://localhost:3000 is fine locally
npm install
npm run dev
```

Icons are pre-generated in `public/`. To regenerate: `npm run gen-icons`.

## Deploy on Dokploy

1. Push this repo to GitHub.
2. Dokploy → the project → **New Application** → source = this repo, **Dockerfile** build.
3. **Environment**:
   ```
   APP_URL=https://reto33.tudominio.com
   BETTER_AUTH_SECRET=<openssl rand -base64 48>
   OTP_DELIVERY=demo
   DATABASE_PATH=/app/data/reto33.db
   ```
   (For real emails later: `OTP_DELIVERY=resend`, `RESEND_API_KEY=...`.)
4. **Domain** → your subdomain, container port **3000**, enable HTTPS.
5. **Volume** → mount one at `/app/data` so accounts & progress persist across redeploys.
6. Deploy. The database is created automatically on first boot.

Once it's running, redeploys can be triggered from Claude via your Dokploy MCP
connector (`deploy_application`).

## Install as an app

Open the site on your phone → Share → **Add to Home Screen**. It launches
full-screen like a native app.
