# FreshDig 2.14.0

2026-10-27

- Removed the automatic page reload and replacement-window recovery behavior. Playback failure keeps the existing mini player open.
- A stalled explicit play now attempts one previous-track/return-to-original cycle, then verifies that playback position advances.
- Queue item identity is preferred to avoid shuffle selecting a different track or the previous button merely resetting the current track to 0:00. Native previous/next controls are used when queue access is unavailable.
- The return step is sent only after a real previous-track transition. A user pause, transport change, robot check or Dig pause cancels obsolete recovery.
- Dig skipping, queue pruning and heard-time accounting are suspended during the short recovery transition.
- Recovery has bounded waits and a 15-second cooldown. A failed cycle does not trigger another cycle, a reload, or a new window.
- Natural end-of-track handling and normal user-controlled mini-player open/close remain available.

Validation includes the required core/later/smoke tests plus runtime, bridge, list-backup and history tests. Runtime cases cover direct/native previous-next, successful play ACK, concurrent requests, cooldown, first-track and previous-button no-op behavior, manual pause/track change, Dig interference, and unsuccessful recovery keeping the window open.

Actual long-running SoundCloud playback remains a manual acceptance check. No store submission is part of this change.
