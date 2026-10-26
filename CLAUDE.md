# Reto 33

Next.js habit PWA (better-auth email OTP + SQLite). See README.md for features.

## Deploy (Dokploy at https://dokploy.drcloud.pe)

- Needs `DOKPLOY_API_KEY` in the environment. Never commit it or print it.
- Config: `deploy/app.conf` (IDs, domain, port, volume). Env vars: `deploy/app.env.template`.
- First time: `bash deploy/dokploy.sh setup`, then write the printed id into
  `DOKPLOY_APP_ID` in `deploy/app.conf` and commit it.
- Redeploy after pushing to `main`: `bash deploy/dokploy.sh deploy`.
- If an endpoint returns a validation error, read it, fix the field names in the
  script and retry (Dokploy versions differ).
- Verify: DNS via `https://dns.google/resolve?name=<domain>&type=A`, then
  `curl -I https://<domain>/sign-in` should return 200.
