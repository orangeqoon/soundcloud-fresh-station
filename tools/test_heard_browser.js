'use strict';
// Real IndexedDB smoke test in a disposable Chromium profile. No dependency,
// existing profile, real SoundCloud session, or external network is required.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const candidates = [process.env.FRESHDIG_TEST_BROWSER,
    path.join(process.env.PROGRAMFILES || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe')];
  const browser = candidates.find(value => value && fs.existsSync(value));
  if (!browser) throw new Error('Set FRESHDIG_TEST_BROWSER to a Chromium executable');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'freshdig-idb-'));
  const target = pathToFileURL(path.join(__dirname, '..', 'tests', 'heard-browser.html')).href;
  const child = spawn(browser, ['--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', '--user-data-dir=' + profile, target], { windowsHide: true, stdio: 'ignore' });
  child.on('error', () => {});
  let socket;
  let sequence = 0;
  const pending = new Map();
  const send = (method, params) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('CDP timeout')); }, 5000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params: params || {} }));
  });
  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    const until = Date.now() + 15000;
    while (!fs.existsSync(portFile) && Date.now() < until) await pause(100);
    if (!fs.existsSync(portFile)) throw new Error('Disposable browser did not start');
    const port = Number(fs.readFileSync(portFile, 'utf8').split('\n')[0]);
    let page;
    while (!page && Date.now() < until) {
      const pages = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
      page = pages.find(p => p.type === 'page' && p.url === target);
      if (!page) await pause(100);
    }
    if (!page) throw new Error('Test page not found');
    socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
    socket.addEventListener('message', event => {
      const response = JSON.parse(event.data);
      const request = pending.get(response.id);
      if (!request) return;
      clearTimeout(request.timer); pending.delete(response.id);
      if (response.error) request.reject(new Error(response.error.message)); else request.resolve(response.result);
    });
    let result = 'PENDING';
    while (result === 'PENDING' && Date.now() < until) {
      const value = await send('Runtime.evaluate', { expression: 'document.getElementById("result").textContent', returnByValue: true });
      result = value.result.value;
      if (result === 'PENDING') await pause(100);
    }
    if (!String(result).startsWith('PASS:')) throw new Error(result);
    console.log(result);
  } finally {
    if (socket && socket.readyState === WebSocket.OPEN) {
      try { await send('Browser.close'); } catch (_) {}
      socket.close();
    }
    for (const request of pending.values()) { clearTimeout(request.timer); request.reject(new Error('test closed')); }
    pending.clear();
    if (child.exitCode === null) child.kill();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
