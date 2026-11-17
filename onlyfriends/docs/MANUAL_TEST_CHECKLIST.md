# OnlyFriends — manual regression checklist (v0.1.1)

Use **your** Instagram session. Do not share credentials with tools or chat logs.

## A. Firefox Desktop (temporary) — do this first

1. `cd onlyfriends && npm run build`
2. `about:debugging` → Load Temporary Add-on → `dist/manifest.json`
3. Open `https://www.instagram.com/` signed in

### Navigation & DMs

- [ ] Bottom/side Explore & Reels links hidden
- [ ] Visiting `/explore/` or `/reels/` shows OnlyFriends block screen (or redirects home)
- [ ] Open **Direct** (`/direct/inbox/` or `/u/direct/`)
- [ ] Open an existing conversation
- [ ] Send a short test message successfully
- [ ] Recipient search / composer still usable (listboxes not blank)
- [ ] Friend profile links still open

### Strict Friends

- [ ] Add 2–3 followed usernames
- [ ] Mode = Strict Friends; allowlist non-empty
- [ ] Home shows only posts with identifiable allowlisted authors
- [ ] Posts without readable author stay hidden
- [ ] Scroll / wait for new posts — filter reapplies (no unrelated flood)
- [ ] Stories tray: non-friends hidden when username readable; own story kept if labeled
- [ ] Note: story viewer swipe may still reach others — expected limitation

### Timer

- [ ] Set session to 1 minute; wait for end screen copy
- [ ] Reload mid-session — remaining time roughly preserved
- [ ] Open second Instagram tab — time should not burn ~2×
- [ ] Override / new session work; Messages from end screen opens DMs

### UI

- [ ] OF button opens settings
- [ ] Timer chip also opens settings
- [ ] EN / FA + RTL; light/dark

## B. Firefox Android (signed XPI only)

Unsigned zip **cannot** install on release Firefox Android.

After you approve signing and install the signed XPI:

- [ ] OF FAB visible above Instagram bottom bar (not under Firefox chrome)
- [ ] Timer chip tappable if FAB hard to reach
- [ ] Settings panel scrolls fully on a phone-sized screen
- [ ] Repeat DM send + Strict Friends + Explore/Reels checks from section A

## C. Record outcomes

Note date, Firefox version, and whether feed author `href`s were present. Update `SELECTORS.md` if Instagram changed paths.
