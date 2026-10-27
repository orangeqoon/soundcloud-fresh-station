# FreshDig 2.13.0

2026-10-27

## Completed: local history and recovery

- Heard-track history is stored in extension-owned IndexedDB with confirmed writes, bounded lookup caches and legacy migration.
- Playback tracking excludes seeks and pauses; recording the current track does not interrupt its current playback session.
- A six-language history page supports count/date inspection, additive JSON import, split JSON backup and deletion.
- Cross-PC transfer is available through manual JSON export/import. No cloud upload is performed.
- A separate extension popup survives SoundCloud recovery reloads and reconnects its controls. The popup is not always-on-top; browser PiP still needs a real user gesture.
- New user pauses and track skips cancel obsolete reload/resume attempts.
- The local `unlimitedStorage` permission supports long-term history retention. See `PRIVACY.md` for data handling and removal.

## Verification

97 Node tests passed; the final targeted runtime checks passed. A disposable headless Chromium profile passed 223 real IndexedDB assertions. UserScript build, syntax, version parity, staged path scan and directory-layout checks passed.

Live SoundCloud audible playback and reload recovery, and browser multi-file download acceptance, still require manual validation.

## Next phases

1. Validate installed-extension playback/recovery during extended SoundCloud use.
2. Add account-separated history and harden large-history backup behavior based on those results.
3. Add optional cloud delta synchronization with explicit opt-in, scoped authorization, deletion conflict handling and updated store/privacy disclosures.

Google Drive automatic synchronization is not implemented in this release.
