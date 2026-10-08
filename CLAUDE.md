# FreshDig for SoundCloud

Chromium MV3 extension + UserScript. Full spec, data-storage map and message protocol: `CLAUDE_REVIEW_GUIDE.md`.

## Rules
- On every code change, bump the version in all four places together: `manifest.json` (`"version"`), `popup.html` (`vX.Y.Z`), `station_hook.js` (console.log `FreshDig vX.Y.Z`), `soundcloud_fresh_station.user.js` (`@version`).
- `soundcloud_fresh_station.user.js` is generated: run `node tools/build_userscript.js` (header + `i18n.js` + `freshdig_core.js` + `station_hook.js`). Regenerate it after editing any of them.
- Every action handled in `station_hook.js`'s `SC_FRESH_STATION_POPUP_ACTION` listener must reply via `ack(...)` / `replyToBridge(...)`, otherwise the popup callback hangs until the bridge's 60s timeout.
- Only accept `postMessage` where `event.source === window`; post to `window.location.origin`, never `'*'`.
- Discovery skipping happens in `onScCurrentSoundChanged()` (SoundCloud playback manager's `change:currentSound` event, fires before audio starts) with `getSkipReason()` as the single rule set; `monitorPlaybackWithMargin()` is only the DOM fallback. SoundCloud uses XHR, not fetch, so the fetch-hook station/stream filters are effectively inactive.
- Discovery mode ON/OFF only through `setDiscoveryEnabled()`; playback mode only through `savePlaybackMode()` (both keep localStorage and `chrome.storage.local` in sync; the latter wins on reload).
- The FOLLOWING_NEW (follow-new-tracks) mode is disabled by `FOLLOWING_NEW_MODE_ENABLED = false` in `station_hook.js`; its code is kept on purpose. Do not delete it.
- Call SoundCloud API v2 only through `scApi()` and get the token only through `getAuthToken()`. Never cache the OAuth token: SoundCloud rotates it.
- Change volume only through `setSoundCloudVolume()` (drives SoundCloud's own volume module; writing `audio.volume` is undone on the next track).
- Media Session: do not override SoundCloud's own play/pause/next/prev/seek handlers or metadata; only add position state, `seekto` and `stop` (`syncMediaSession()`).
- Opening the mini player (Document PiP / window.open) needs a click inside the page. Popup clicks do not count: `openMiniPlayer()` falls back to the in-page launch button (`showMiniPlayerLaunchPrompt()`). Auto-open on tab switch uses the Media Session `enterpictureinpicture` handler (`registerAutoMiniPlayerHandler()`, setting `autoMiniPlayer`).
- The ➕ playlist button toggles: add if the current track is not in the target playlist, remove if it is (decided from a fresh GET of the playlist, not the cache).
- Repost from the mini player: `PUT me/track_reposts/:id`, then `PUT me/track_reposts/:id/caption` with `{caption}` (max 140 chars), same as SoundCloud.
- Every own API call goes through `apiFetch()` (via `scApi()`, or directly for station refill and `/resolve`): min 250ms gap, 60/min, back-off after 403/429. Never call `originalFetch` for api-v2 directly. When a robot check is detected (`state.robotBlocked`), auto-skip and own API calls stay paused; never try to solve or bypass it.
- Full sync (likes/follows/playlists) runs in one tab only (Web Locks) and at most every 6 hours; other tabs read the cache and get `cache-updated` over `BroadcastChannel('freshdig')`. Only the popup's 🔄 forces it.
- Skip rules live in `freshdig_core.js` (pure, tested with `node --test "tests/*.test.js"`). Skip reasons are i18n keys (`skipReason...`), translated at display time.
- Find SoundCloud internals with `findScModule()` by shape, never by webpack module id.
- Never let `undefined` / `null` / empty keys into the dislike maps (causes skip-everything loops).

## Check
```bash
for f in *.js tools/*.js tests/*.js; do node --check "$f"; done
node --test "tests/*.test.js"   # (Node 22: `node --test tests/` does not work)
```
