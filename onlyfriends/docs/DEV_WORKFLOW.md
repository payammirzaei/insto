# Development & release workflow

## Daily loop

```bash
cd onlyfriends
npm install
npm run watch          # rebuild on change
# other terminal:
npm test               # or npm run test:watch
```

Firefox Desktop temporary load:

1. `about:debugging#/runtime/this-firefox`
2. Load Temporary Add-on → `dist/manifest.json`
3. After rebuilds, click **Reload** on the temporary extension card

## Before a release candidate

```bash
npm test
npm run typecheck
npm run build
npm run package
```

Inspect `release/PACKAGING_NOTES.txt` for the SHA-256 of the unsigned zip.

## Signing (requires your approval)

OnlyFriends must **not** be submitted to AMO, signed, published, or pushed remotely without explicit approval.

When approved:

1. Use Mozilla’s signing path you choose (AMO unlisted / self-distribution).
2. Produce a **Mozilla-signed `.xpi`**.
3. That signed XPI is what Firefox Android release can install.
4. The unsigned zip from `npm run package` is **not** an Android installable.

## Android manual smoke (signed build only)

1. Install signed XPI on device.
2. Open `instagram.com` in Firefox Android (signed-in session).
3. Open **OF** → add friends → Strict Friends.
4. Confirm Explore/Reels blocked, DMs open, timer end screen with soft override.
5. Walk `MANUAL_TEST_CHECKLIST.md`.
