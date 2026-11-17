# OnlyFriends

A minimalist, distraction-free Instagram experience for **Firefox (Android first, desktop second)**.

OnlyFriends is a WebExtension that reshapes the Instagram website you already signed into. It does **not** ask for Instagram credentials, does **not** call Instagram private APIs, and does **not** run a backend.

## What it does

- **Strict Friends feed** — manually maintained username allowlist; posts without a reliably matched author are hidden (fail closed).
- **Following mode** — optional attempt to use Instagram’s own Following feed/tab when detectable. Separate from the Strict Friends allowlist. The `?variant=following` route is probed, never assumed.
- **Stories tray filtering** — keeps the tray; filters rings when usernames are readable. Story viewer swipe navigation is **not** safely filterable.
- **Distraction guards** — hides/blocks Explore & Reels entry points; keeps Messages and profiles usable.
- **Mindful timer** — configurable session length (default 15 minutes), optional daily budget, soft override, calm end screen.
- **Local UI** — light/dark themes, English & فارسی (RTL), settings via on-page **OF** button (no need to roam Instagram chrome).

## What it deliberately does not do

- No credential capture, cookie extraction, or token storage
- No scraping of private endpoints / GraphQL interception for data collection
- No auto-scrolling, auto-liking, or automated story retrieval
- No telemetry, analytics, or remote services
- No claim of complete ad removal
- No unsigned “sideload on release Android” fantasy — see packaging below

## Project layout

```
onlyfriends/
  src/                   # extension source
  site/                  # Railway landing page (static)
  tests/
  docs/
  scripts/               # build, package, serve
  dist/                  # extension build output
  release/               # unsigned zip for download/signing input
  railway.toml           # Railway build/start/health
```

## Railway

Companion **landing + artifact host** (not an Instagram backend):

```bash
cd onlyfriends
npm run start:web          # local: http://localhost:8080
railway up -y -m "OnlyFriends site"
```

Details: [`docs/RAILWAY.md`](docs/RAILWAY.md). If the Git root is the parent `Insto` repo, set Railway **Root Directory** to `onlyfriends`.

## Development

Requirements: Node 18+.

```bash
cd onlyfriends
npm install
npm test
npm run typecheck
npm run build
```

Watch mode:

```bash
npm run watch
```

### Firefox Desktop (temporary)

1. Build (`npm run build`)
2. Open `about:debugging#/runtime/this-firefox`
3. **Load Temporary Add-on…** → select `dist/manifest.json`
4. Visit `https://www.instagram.com/` while signed in
5. Tap **OF** for settings; add friend usernames

Temporary add-ons disappear when Firefox restarts.

### Firefox Android

**Release Firefox Android cannot install unsigned extensions.**

Stable installation requires a **Mozilla-signed XPI** (AMO listed/unlisted or self-distribution signing). The file produced by `npm run package` is an **unsigned ZIP for review/signing input** — do not treat it as installable on release Android.

Manual Android test flow after you have a signed XPI (only with your approval to sign/publish):

1. Install the signed XPI on the device
2. Open Instagram in Firefox Android
3. Run `docs/MANUAL_TEST_CHECKLIST.md`

## Packaging

```bash
npm run package
```

Outputs:

- `release/onlyfriends-0.1.1-unsigned.zip`
- `release/PACKAGING_NOTES.txt` (checksum + signing reminder)

Stable Gecko ID (do not change after first signed release): `onlyfriends@onlyfriends.app`  
Unlisted signing steps (prepared, **not submitted**): [`docs/AMO_UNLISTED_SIGNING.md`](docs/AMO_UNLISTED_SIGNING.md)  
Live DOM verification log: [`docs/SELECTORS.md`](docs/SELECTORS.md) · [`docs/VALIDATION_REPORT.md`](docs/VALIDATION_REPORT.md)

**Do not submit to Mozilla AMO, publish, push remotes, or deploy without explicit approval.**

## Permissions (minimum)

| Permission | Why |
|------------|-----|
| `storage` | Local settings + time tracking only |
| `https://www.instagram.com/*` (and `instagram.com`) | Content scripts / CSS on the Instagram site you already use |

No history, tabs (beyond messaging the active tab from the popup), cookies, webRequest, or `<all_urls>`.

## Architecture notes

- **UI** — shadow-DOM overlay (`#onlyfriends-host`) so Instagram CSS does not break controls
- **DOM adapters** — distraction guards, Following probe, debounced `MutationObserver`
- **Filtering** — username normalization + href/aria matching; fail closed in Strict mode
- **Navigation guards** — click capture + history soft-guard for Explore/Reels
- **Time tracking** — `browser.storage.local`, pauses when the document is hidden

Fragile selectors are documented in [`docs/SELECTORS.md`](docs/SELECTORS.md). Capability status is shown in settings after probing the live page.

## Feature reality

See [`docs/FEATURE_STATUS.md`](docs/FEATURE_STATUS.md) for working / partial / blocked-by-Instagram items.

## License

Private / unlicensed unless you decide otherwise. Not affiliated with Instagram or Meta.
