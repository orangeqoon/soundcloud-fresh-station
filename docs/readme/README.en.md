# FreshDig for SoundCloud

> 🌐 [日本語](../../README.md) | [English](README.en.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Español](README.es.md) | [Tiếng Việt](README.vi.md)

FreshDig is an Edge / Chrome extension that organizes SoundCloud Stations around your discovery rules. With Dig ON, it skips liked tracks, followed artists, NoPlay tracks, saved artists, and blocked artists, then prioritizes unseen tracks and artist variety within SoundCloud's existing queue.

## The problem it solves

While listening to a station, familiar tracks and unwanted artists can keep returning. FreshDig does not replace SoundCloud recommendations; it applies local exclusion, saved-artist, and optional heard-history rules to the candidates and queue that SoundCloud provides.

## Main features

- **Dig mode**: detects and skips liked, followed, and excluded tracks, artists, and genres
- **Skip tracks you have heard once**: only when enabled in Dig settings, records tracks that actually played for 10 seconds and skips them next time (off by default)
- **Dislike / Hate**: exclude a single track or a whole artist
- **Listen-later list**: save artists and open their tracks page from the extension icon
- **Mini player**: a separate window to play, skip, adjust volume, add to playlist, Like, Repost, Follow, and exclude
- **List backup**: export the four lists (listen later, blocked tracks, blocked artists, blocked genres) as Markdown and restore from JSON
- **Bug report**: save a local diagnostic report to investigate playback stops and similar issues

## How "skip tracks you have heard once" records tracks

This setting is off by default. When on, only tracks whose playback position actually advanced 10 seconds are recorded, by track ID. Seeking or pausing alone is not recorded. Records are stored in the page's IndexedDB, falling back to localStorage when unavailable. When you open an artist's tracks page directly, playback on that page takes priority and Dig skip rules are not applied.

## Data and privacy

FreshDig settings, lists, and listening records are stored in your browser. FreshDig has no analytics server of its own and sends nothing for advertising. Actions such as Like, Follow, Repost, and adding to a playlist operate your SoundCloud account, so they communicate with SoundCloud.

## Installation

1. Open `edge://extensions` or `chrome://extensions`
2. Enable developer mode
3. Click "Load unpacked" and select the extension folder

With Tampermonkey, you can load `soundcloud_fresh_station.user.js` from the repository.

## License

MIT License
