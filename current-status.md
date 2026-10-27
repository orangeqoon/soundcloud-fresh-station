# Current status

- Track: heard-history reliability and automatic recovery window.
- Status: DONE (implementation and automated verification; live SoundCloud playback/reload and multi-file browser download acceptance remain manual checks).
- Version: 2.13.0.
- Scope: extension-owned durable IndexedDB, bounded caches, wall/media playback tracker, current-session protection, legacy migration, six-language history backup/import/delete UI, extension-owned recovery popup, pause/skip race protection, privacy documentation.
- Verification: required core/later/smoke 37/37; extended runtime/bridge/list-backup/history/recovery 60/60; final targeted reload/history checks 5/5; real Chromium IndexedDB 223 assertions; UserScript build/syntax/version parity; staged hardcoded-path check 24 files/0 findings; parent layout check passes.
- Review: scout identified PiP activation failure; independent critic's migration, reload cancellation, timestamp deduplication and slider findings addressed.
- Limits: automatic recovery uses an ordinary extension popup (not always-on-top PiP); PiP needs a real user click. Cloud sync is deferred; cross-PC transfer uses JSON parts. History is shared within one browser profile, not account-scoped.
- Publication: user requested GitHub push and Chrome/Edge submission on 2026-10-27; release execution in progress. See docs/release-2.13.0.md for phase boundaries.
