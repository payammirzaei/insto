# Mozilla AMO Unlisted signing — preparation (DO NOT SUBMIT YET)

This package is prepared for **Unlisted** signing so Firefox Android can install a Mozilla-signed XPI.  
**Do not upload, submit, or publish without explicit approval.**

## Stable Gecko add-on ID

```
onlyfriends@onlyfriends.app
```

Set in `src/manifest.json` → `browser_specific_settings.gecko.id`.

**Do not change this ID after the first signed version** or updates will install as a different add-on.

Version for this candidate: **0.1.1**

## What to upload when approved

1. Build:
   ```bash
   cd onlyfriends
   npm test
   npm run typecheck
   npm run package
   ```
2. Artifact: `release/onlyfriends-0.1.1-unsigned.zip`  
   (Also keep `release/PACKAGING_NOTES.txt` with SHA-256.)
3. On [addons.mozilla.org](https://addons.mozilla.org) → developer hub → **Submit a new add-on** → distribution **On your own / Unlisted**.
4. Upload the zip; choose Firefox for Android + Desktop compatibility as applicable.
5. After automated signing, download the **signed `.xpi`** and install that on Android.

## Listing fields (draft — for when you approve)

| Field | Suggested text |
|-------|----------------|
| Name | OnlyFriends |
| Summary | Calm, friends-only Instagram in Firefox. Uses the page you already signed into. |
| Description | OnlyFriends hides Explore/Reels entry points and can filter the home feed to a manual friends allowlist by reshaping Instagram’s website DOM. Preferences stay on-device. No Instagram passwords are collected. Not affiliated with Meta. Limitations: Instagram layout changes can reduce accuracy; story viewer swipe is not filtered; ad hiding is best-effort. |
| Categories | Social & Communication / Privacy & Security |
| Support email | (your email) |
| License | All Rights Reserved (or your choice) |

## Privacy disclosure (required honesty)

- Host permissions: `instagram.com` / `www.instagram.com` only  
- `storage` for local settings + time tracking  
- No remote telemetry, no account system, no sale of data  
- Does not read or store DM content, cookies, or media

## Android install after signing

1. Transfer signed `.xpi` to the phone (or open the AMO unlisted install link).
2. Firefox Android → open the XPI / follow install prompt.
3. Visit Instagram → confirm OF button + timer.
4. Run `MANUAL_TEST_CHECKLIST.md`.

## Explicit non-actions until approval

- No AMO submission  
- No `web-ext sign` against credentials  
- No GitHub release / push of secrets  
- No claiming an unsigned zip is Android-installable  
