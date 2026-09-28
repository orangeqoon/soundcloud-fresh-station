# FreshDig for SoundCloud

Chromium MV3 extension + UserScript. Full spec, data-storage map and message protocol: `CLAUDE_REVIEW_GUIDE.md`.

## Rules
- On every code change, bump the version in all four places together: `manifest.json` (`"version"`), `popup.html` (`vX.Y.Z`), `station_hook.js` (console.log `FreshDig vX.Y.Z`), `soundcloud_fresh_station.user.js` (`@version`).
- `soundcloud_fresh_station.user.js` = its 10-line UserScript header + the full `station_hook.js`. Regenerate it after editing `station_hook.js`.
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
- Find SoundCloud internals with `findScModule()` by shape, never by webpack module id.
- Never let `undefined` / `null` / empty keys into the dislike maps (causes skip-everything loops).

## Check
```bash
for f in *.js; do node --check "$f"; done
```
