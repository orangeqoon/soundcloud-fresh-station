# FreshDig for SoundCloud (CODEX & AI Agent Guide)

> **For Codex, GPT-4o, and other AI coding assistants**:
> This document provides an exhaustive, machine-readable, and structured overview of **FreshDig for SoundCloud (v1.9.13)**. It covers architecture, internal mechanics, message protocols, data storage schemas, skip logic, and development invariants.

---

## 1. Executive Summary

- **Project**: FreshDig for SoundCloud (SoundCloud Fresh Station)
- **Current Version**: `v2.1.x` (SemVer strictly synchronized across 4 files: `manifest.json`, `popup.html`, `station_hook.js`, `soundcloud_fresh_station.user.js`)
- **Platforms**:
  - Chromium Extension (Manifest V3 for Microsoft Edge Add-ons & Chrome Web Store)
  - Standalone UserScript (`soundcloud_fresh_station.user.js` for Violentmonkey / Tampermonkey)
- **Repository**: `browser_extensions/soundcloud_fresh_station` (Submodule: `https://github.com/orangeqoon/soundcloud-fresh-station`)
- **Primary Mission**:
  Continuous, uninterrupted discovery of unknown artists on SoundCloud. It automatically evaluates upcoming tracks and instantly skips tracks that are already liked, artists already followed, tracks marked as "NoPlay" (disliked), excluded artists, excluded genres, or tracks exceeding freshness limits.

---

## 2. System Architecture & Process Boundaries (MV3)

Chromium Manifest V3 enforces strict isolation. FreshDig operates across four distinct execution contexts:

```
+-------------------------------------------------------------------------+
|                               Web Browser                               |
|                                                                         |
|  +--------------------+        chrome.runtime.sendMessage               |
|  |     popup.html     | <============================================+  |
|  |     popup.js       |                                              |  |
|  |   (Extension UI)   |                                              |  |
|  +--------------------+                                              |  |
|                                                                      |  |
|  +--------------------+        chrome.cookies.get (oauth_token)      |  |
|  |    background.js   | <=========================================+  |  |
|  |  (Service Worker)  |                                           |  |  |
|  +--------------------+                                           |  |  |
|                                                                   |  |  |
|  SoundCloud Tab:                                                  |  |  |
|  +--------------------+                                           |  |  |
|  | content_bridge.js  | <-----------------------------------------+--+  |
|  |  (ISOLATED World)  |                                                 |
|  +---------+----------+                                                 |
|            |                                                            |
|            | window.postMessage (target: SC_FRESH_STATION, origin check)|
|            v                                                            |
|  +---------+----------+        Internal Hooks & Audio Manager           |
|  |  station_hook.js   | <--------------------------------------------+  |
|  |   (MAIN World)     |                                              |  |
|  |   + Core & i18n    |                                              |  |
|  +---------+----------+                                              |  |
|            |                                                         |  |
|            +-----------------------+                                 |  |
|            |                       |                                 |  |
|            v                       v                                 |  |
|   +-------------------+   +------------------+                       |  |
|   |    Mini Player    |   |  SoundCloud API  |                       |  |
|   |  (PiP / Subwindow)|   |   v2 (REST)      |                       |  |
|   +-------------------+   +------------------+                       |  |
+-------------------------------------------------------------------------+
```

### Context Breakdown
| File | Context | Execution Privileges | Responsibilities |
| :--- | :--- | :--- | :--- |
| `manifest.json` | Extension Config | `storage`, `tabs`, `activeTab`, `cookies` | Permissions, icons, locales, extension metadata. |
| `background.js` | Service Worker | Chrome APIs (`chrome.cookies`) | Reads SoundCloud OAuth token (`oauth_token`) from cookies and serves it to Content Script. |
| `content_bridge.js` | Content Script (ISOLATED) | Chrome Runtime + DOM Access | Relays messages between `popup.js` / `background.js` and MAIN World via `window.postMessage`. |
| `station_hook.js` | Web Page (MAIN World) | Full Page JS Scope | The primary engine (~4500 lines). Hooks SoundCloud playback manager, monitors audio, executes skips, handles mini-player UI, runs API sync. |
| `freshdig_core.js` | Shared Pure Module | Pure JavaScript (Node/Browser) | Pure functions: `getSkipReason()`, `normalizeFreshFilter()`, `pruneAuthorStats()`, `mergeLogs()`. Fully unit-tested. |
| `i18n.js` | Shared Dictionary | UMD (Node/Browser) | 4 languages: `ja` (Japanese), `en` (English), `de` (German), `ru` (Russian). |
| `popup.html` / `popup.js` | Extension Popup UI | Chrome Extension Window | User interface for settings, language switcher, playlist selection, export/import, diagnostic logs, volume control. |
| `soundcloud_fresh_station.user.js` | Standalone UserScript | Userscript Engine | Bundled via `tools/build_userscript.js` combining header + `i18n.js` + `freshdig_core.js` + `station_hook.js`. |

---

## 3. Core Mechanics & Algorithms

### 3.1 Zero-Latency Skip Engine (`hookScCurrentSoundChange`)
- **Primary Mechanism**: Hooks SoundCloud's internal Backbone/Marionette playback manager event:
  `playManager.on('change:currentSound', onScCurrentSoundChanged)`.
- **Timing**: Fires **before** audio decoding and playback commence. The hook extracts track metadata (`id`, `title`, `user.id`, `genre`, etc.) and invokes:
  `freshdig_core.getSkipReason(track, state, options)`
- **Evaluation Order**:
  1. `dislikedTracks` (Track ID or normalized Title in NoPlay list) -> `skipReasonDisliked`
  2. `hatedArtistIds` (Artist ID or normalized Artist Name in exclusion list) -> `skipReasonHated`
  3. `excludedGenres` (Genre match) -> `skipReasonGenre`
  4. `myUserId` (Own uploaded track) -> `skipReasonOwn`
  5. `likedTrackIds` (Liked tracks from `me/track_likes/ids`) -> `skipReasonLiked`
  6. `followingUserIds` (Tracks by followed artists) -> `skipReasonFollowing`
  7. **Freshness Filter (Dig Config)**:
     - `followers` > threshold -> `skipReasonManyFollowers`
     - `artistTracks` > threshold -> `skipReasonManyTracks`
     - `plays` > threshold -> `skipReasonManyPlays`
     - `age` > threshold -> `skipReasonOldTrack`
- **Fallback Watchdog**: `monitorPlaybackWithMargin()` periodically inspects DOM and `<audio>` time updates as a safety net if Backbone events fail.
- **Runaway Guard**: If 20 tracks are skipped consecutively without playing, FreshDig forces 1 track to play to prevent infinite skipping loops.

### 3.2 SoundCloud Internal Access (`findScModule`)
SoundCloud uses a Webpack bundle. FreshDig locates internal singletons dynamically by searching Webpack chunks (`window.webpackChunk_soundcloud_pages`) for module shapes rather than static chunk IDs.
- Audio Manager / Playback Model
- Volume Control Module
- Current Track Model

### 3.3 Rate Limiting & Safe API Engine (`scApi` & `apiFetch`)
All outbound SoundCloud API calls follow strict safety constraints:
- Minimum interval: **250ms** between requests.
- Maximum burst rate: **45 requests / minute**.
- Exponential Backoff: Triggered upon HTTP 403 or 429 (`60s -> 120s -> 300s`).
- **Robot Detection (`state.robotBlocked`)**: Detects SoundCloud Cloudflare/Datadome challenge pages. Automatically halts automated skipping and API calls until the user solves the captcha manually. Never attempts automated bypass.

### 3.4 Floating Mini-Player (Document PiP & window.open)
- Modern browsers: Uses `documentPictureInPicture.requestWindow({ width: 340, height: 420 })`.
- Fallback: `window.open(...)` as an independent minimal popup window.
- **Auto-PiP**: Utilizes Media Session API `enterpictureinpicture` handler (`autoMiniPlayer: true`). When the user switches tabs while music is playing, the browser natively prompts/opens the PiP window.
- **Repost + Caption**: Clicking `🔁` in the mini player opens a modal for an optional 140-character comment.
  1. Sends `PUT me/track_reposts/{trackId}` to repost.
  2. If a comment is provided, sends `POST tracks/{trackId}/comments` (`{ comment: { body: caption, timestamp: 0 } }`).

### 3.5 NoPlay Playlist Synchronization (500-track Chunking)
- SoundCloud enforces a strict **500-track limit** per playlist.
- FreshDig solves this by chunking exported NoPlay tracks into sequentially numbered playlists:
  - `[FreshDig] NoPlay` (1 - 500)
  - `[FreshDig] NoPlay 2` (501 - 1000)
  - `[FreshDig] NoPlay 3` (1001 - 1500)
- Backward compatibility: The import scanner searches for playlists matching `noplay`, `never play`, or `disliked tracks`.

---

## 4. Message Protocol Specification

### Bridge Protocol (`content_bridge.js` <-> `station_hook.js`)
All cross-world messages use `window.postMessage` with source validation:
```javascript
// Outbound from Bridge or Hook:
window.postMessage({
  target: 'SC_FRESH_STATION', // or 'SC_FRESH_STATION_BRIDGE'
  action: 'ACTION_NAME',
  payload: { ... }
}, window.location.origin);
```

#### Key Actions
| Action | Initiator | Direction | Description |
| :--- | :--- | :--- | :--- |
| `GET_STATUS` | Popup | Bridge -> Hook | Requests current track, state, and stats. |
| `STATUS_UPDATE` | Hook | Hook -> Bridge | Broadcasts track change, play state, or sync status. |
| `RUN_ACTION` | Popup | Bridge -> Hook | Triggers action (`like`, `repost`, `next`, `prev`, `vol`, `addPl`, `dislike`, `hate`). Must invoke `replyToBridge`! |
| `SET_LANGUAGE` | Popup | Bridge -> Hook | Switches UI locale (`ja`, `en`, `de`, `ru`, `auto`). |
| `EXPORT_DISLIKES` | Popup | Bridge -> Hook | Triggers SoundCloud playlist export. |
| `IMPORT_DISLIKES` | Popup | Bridge -> Hook | Reads tracks from SoundCloud NoPlay playlists. |
| `GET_DIAG_LOG` | Popup | Bridge -> Hook | Returns formatted ring-buffer diagnostic log for debugging playback halts. |

---

## 5. Storage Keys & Schemas

### `localStorage` (Origin: `https://soundcloud.com`)
| Key | Type | Description |
| :--- | :--- | :--- |
| `sc_fresh_station_data_v1` | JSON Object | Blacklists: `{ dislikedTracks: { [id]: { title, date } }, hatedArtists: { [id]: name }, excludedGenres: [] }` |
| `sc_fresh_station_target_playlist_id` | String | Target playlist ID for one-click addition. |
| `sc_fresh_station_discovery_enabled` | Boolean string (`"true"`/`"false"`) | Whether discovery auto-skip is enabled. |
| `sc_fresh_station_auto_miniplayer` | Boolean string (`"true"`/`"false"`) | Whether auto-PiP on tab change is enabled. |
| `sc_fresh_station_preferred_language` | String (`"auto"`/`"ja"`/`"en"`/`"de"`/`"ru"`) | Active UI language. |
| `sc_fresh_station_stats_v1` | JSON Object | Usage counters: `{ totalSkips: number, totalPlaylistAdds: number }`. |
| `sc_fresh_station_fresh_filter` | JSON Object | Dig Config thresholds: `{ followers: { on, n }, tracks: { on, n }, plays: { on, n }, age: { on, n } }`. |
| `sc_fresh_station_rate_prompt` | JSON Object | Rating prompt state: `{ dismissed: boolean, lastShown: number, interactions: number }`. |

### `chrome.storage.local` (Extension Isolated Storage)
Mirrors key settings (`preferredLanguage`, `discoveryEnabled`, `autoMiniPlayer`, `targetPlaylistId`) to persist configuration across popup invocations without querying the tab.

---

## 6. Development Invariants (Rules AI Must Follow)

1. **Strict 4-Way Version Bump**:
   Every release must bump the SemVer version identically across:
   - `manifest.json` (`"version": "X.Y.Z"`)
   - `popup.html` (`vX.Y.Z`)
   - `station_hook.js` (`console.log('... FreshDig vX.Y.Z')`)
   - `soundcloud_fresh_station.user.js` (Run `node tools/build_userscript.js`)
2. **Always Run UserScript Builder**:
   `soundcloud_fresh_station.user.js` is an auto-generated build artifact. After editing `i18n.js`, `freshdig_core.js`, or `station_hook.js`, you **MUST** run:
   ```bash
   node tools/build_userscript.js
   ```
3. **Mandatory Ack in Action Handlers**:
   Every action dispatched via `SC_FRESH_STATION_POPUP_ACTION` in `station_hook.js` must resolve via `ack(...)` or `replyToBridge(...)`. If omitted, the popup listener hangs until the 60-second timeout expires.
4. **Volume Control Invariant**:
   Never write directly to HTML5 `audio.volume` (SoundCloud overrides this on every track load). Always use `setSoundCloudVolume()` which drives SoundCloud's native volume module.
5. **No Absolute Paths**:
   Follow workspace portability guidelines (`check_hardcoded_paths.ps1`). Never hardcode local paths (`C:\...`).
6. **No Token Caching**:
   SoundCloud frequently rotates OAuth tokens. Never cache tokens long-term in persistent storage; always request fresh tokens via `getAuthToken()`.

---

## 7. Verification & Testing Playbook

When modifying code in this repository, always run this exact verification sequence:

```powershell
# 1. Syntax check all JavaScript files
node -c manifest.json  # (ensure valid JSON)
node -c background.js
node -c content_bridge.js
node -c freshdig_core.js
node -c i18n.js
node -c popup.js
node -c station_hook.js

# 2. Build UserScript
node tools/build_userscript.js
node -c soundcloud_fresh_station.user.js

# 3. Run all unit & smoke tests (Node 22 compliant)
node --test tests/core.test.js tests/later.test.js tests/smoke.test.js

# 4. Package distribution zip
powershell -ExecutionPolicy Bypass -Command @"
`$zipPath = 'dist/soundcloud-fresh-station-1.9.13.zip'
`$tempDir = Join-Path `$env:TEMP 'freshdig_pack'
if (Test-Path `$tempDir) { Remove-Item `$tempDir -Recurse -Force }
New-Item -ItemType Directory -Path `$tempDir | Out-Null
Copy-Item manifest.json, popup.html, popup.js, station_hook.js, content_bridge.js, background.js, freshdig_core.js, i18n.js `$tempDir
Copy-Item _locales, icons `$tempDir -Recurse
Compress-Archive -Path "`$tempDir\*" -DestinationPath `$zipPath -Force
Remove-Item `$tempDir -Recurse -Force
"@

# 5. Portability check from repo root
cd c:\scripts
powershell -ExecutionPolicy Bypass -File .\tools\portability\check_hardcoded_paths.ps1 -StagedOnly
powershell -ExecutionPolicy Bypass -File .\tools\portability\check_layout.ps1
```
