# FreshDig for SoundCloud

Chromium MV3 extension + UserScript. Full spec, data-storage map and message protocol: `CLAUDE_REVIEW_GUIDE.md`.

## Rules
- On every code change, bump the version in all four places together: `manifest.json` (`"version"`), `popup.html` (`vX.Y.Z`), `station_hook.js` (console.log `FreshDig vX.Y.Z`), `soundcloud_fresh_station.user.js` (`@version`).
- `soundcloud_fresh_station.user.js` = its 10-line UserScript header + the full `station_hook.js`. Regenerate it after editing `station_hook.js`.
- Every action handled in `station_hook.js`'s `SC_FRESH_STATION_POPUP_ACTION` listener must reply via `ack(...)` / `replyToBridge(...)`, otherwise the popup callback hangs until the bridge's 60s timeout.
- Only accept `postMessage` where `event.source === window`; post to `window.location.origin`, never `'*'`.
- Change playback mode only through `savePlaybackMode()` (keeps localStorage and `chrome.storage.local` in sync; the latter wins on reload).
- Never let `undefined` / `null` / empty keys into the dislike maps (causes skip-everything loops).
- Do not run `writer.js`: it embeds stale 2026-09-18 code and overwrites the real sources.

## Check
```bash
for f in *.js; do node --check "$f"; done
```
