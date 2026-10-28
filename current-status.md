# Current status

- Track: previous-track/return-to-original playback recovery.
- Status: DONE (implementation and automated tests; live SoundCloud audible recovery remains a manual acceptance check).
- Version: 2.14.0.
- Scope: removed automatic page reload, replacement-window UI/module and startup restore; keep the existing mini player open. Stalled playback uses one previous/next cycle with progress verification, user-cancellation guards, Dig suspension and a 15-second cooldown.
- Verification: 96 Node tests pass, including 37 required core/later/smoke tests and the new recovery success/failure/transport/cooldown/no-previous cases; syntax/diff checks and UserScript build pass.
- History: v2.13.0 local history and manual backup remain available; cloud sync/account separation remain future work.
- Publication: no commit, push or store submission for this change. v2.13.0 was pushed to GitHub and submitted to Edge; Chrome upload succeeded but its privacy-practices declaration blocked submission.
