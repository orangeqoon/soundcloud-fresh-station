// .user.js を作る: UserScript ヘッダー + i18n.js + freshdig_core.js + list_backup.js + station_hook.js
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const manifest = JSON.parse(read('manifest.json'));
const header = [
  '// ==UserScript==',
  '// @name         FreshDig for SoundCloud - 新アーティスト自動発掘',
  '// @version      ' + manifest.version,
  '// @description  知ってる曲ゼロ！未試聴の新アーティストだけを連続再生・ワンクリック追加・Dislike除外・浮遊ミニプレイヤー',
  '// @author       Antigravity',
  '// @match        https://soundcloud.com/*',
  '// @run-at       document-start',
  '// @grant        none',
  '// ==/UserScript==',
  ''
].join('\n');
const body = ['i18n.js', 'freshdig_core.js', 'list_backup.js', 'station_hook.js'].map(read).join('\n');
fs.writeFileSync(path.join(root, 'soundcloud_fresh_station.user.js'), header + '\n' + body);
console.log('built soundcloud_fresh_station.user.js v' + manifest.version);
