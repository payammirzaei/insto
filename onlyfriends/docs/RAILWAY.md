# Railway deployment (OnlyFriends site)

OnlyFriends is a **Firefox WebExtension**. Railway hosts a small companion site that:

- serves the landing page
- exposes `/health` for Railway healthchecks
- serves unsigned build artifacts from `/download/…`

It does **not** proxy Instagram, collect credentials, or sync preferences.

## Deploy from this folder

```bash
cd onlyfriends
railway up -y -m "OnlyFriends landing + artifacts"
```

Or in the Railway dashboard: set **Root Directory** to `onlyfriends` if the Git repo root is the parent `Insto` folder.

## What Railway runs

From `railway.toml`:

1. **Build:** `npm ci && npm run build && npm run package`
2. **Start:** `npm start` → `node scripts/serve.mjs`
3. **Health:** `GET /health`

The process listens on `0.0.0.0:$PORT`.

## Endpoints

| Path | Purpose |
|------|---------|
| `/` | Landing page |
| `/health` | JSON healthcheck |
| `/api/release` | Lists files in `release/` |
| `/download/<file>` | Downloads package / notes |

## Important

- Unsigned ZIP ≠ Firefox Android install. Signed XPI still requires Mozilla signing + your approval to submit.
- Do not set Instagram secrets as Railway variables — there are none to set.
- Generate a public domain in Railway when you want a shareable URL (`railway domain`).

## Local smoke

```bash
npm run build
npm run package
npm start
# open http://localhost:8080/health
```
