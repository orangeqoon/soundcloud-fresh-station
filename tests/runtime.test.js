'use strict';

// station_hook.js is an IIFE. These tests run an instrumented copy in a VM so
// the assertions can exercise the runtime's private gates without adding a
// production export or changing the userscript's page-facing API.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const hookSource = fs.readFileSync(path.join(__dirname, '..', 'station_hook.js'), 'utf8');
const core = require('../freshdig_core.js');
const i18n = require('../i18n.js');

function instrumentHook() {
  const marker = '\n})();';
  const at = hookSource.lastIndexOf(marker);
  assert.ok(at >= 0, 'station_hook.js IIFE terminator not found');
  const hooks = [
    'state', 'robotState', 'robotRecovery', 'apiBackoff', 'apiFetch',
    'probeRobotRecovery', 'filterStationTracks',
    'getCoreSkipReason', 'getSkipReason', 'isOnLaterArtistPage', 'doAutoSkip', 'skipPacing', 'rememberPlaybackMedia', 'laterState', 'pendingInteractions',
    'beginInteraction', 'getPendingInteraction', 'endInteraction',
    'syncCurrentTrackInteractionsFromDom', 'toggleLikeFromNative', 'injectButtons',
    'fdRemote', 'TAB_ID', 'getAutoPipDiagnostics', 'registerAutoMiniPlayerHandler', 'setAutoMiniPlayer', 'mpRemoteCall',
    'schedulePlaybackRecovery', 'playbackIntent', 'scTogglePlay', 'scInternals',
    'getDiagLogEntries', 'getPlaybackDiagnostic',
    'MP_ACTIONS', 'setSoundCloudVolume', 'toggleSoundCloudMute',
    'requestPlaybackPageReload', 'restoreMiniPlayerAfterReload', 'verifyAndRecoverExplicitPlay',
    'beginHeardSession', 'heardPlayback', 'heardTracker', 'heardCache', 'heardMisses', 'heardLookup', 'observeHeardPlayback'
  ];
  return hookSource.slice(0, at) + '\nwindow.__setTestMiniPlayer = function(w) { miniPlayerWindow = w; };\nwindow.__runtimeHooks = {' + hooks.map((name) => name + ': ' + name).join(', ') + '};\n' + hookSource.slice(at);
}

function classList(initial) {
  const values = new Set(initial || []);
  return {
    add(...names) { names.forEach((name) => values.add(name)); },
    remove(...names) { names.forEach((name) => values.delete(name)); },
    contains(name) { return values.has(name); },
    toggle(name, force) {
      const next = force === undefined ? !values.has(name) : !!force;
      if (next) values.add(name); else values.delete(name);
      return next;
    },
    toString() { return Array.from(values).join(' '); }
  };
}

function element(options) {
  options = options || {};
  const attrs = Object.assign({}, options.attrs || {});
  const el = {
    tagName: String(options.tagName || 'DIV').toUpperCase(),
    style: {},
    dataset: {},
    classList: classList(options.classes),
    textContent: options.textContent || '',
    innerHTML: options.innerHTML || '',
    children: [],
    parentNode: null,
    isConnected: options.isConnected !== false,
    offsetParent: {},
    clicked: 0,
    addEventListener() {},
    removeEventListener() {},
    appendChild(child) { this.children.push(child); child.parentNode = this; return child; },
    insertBefore(child, before) {
      const at = this.children.indexOf(before);
      if (at < 0) this.children.push(child); else this.children.splice(at, 0, child);
      child.parentNode = this;
      return child;
    },
    remove() { this.isConnected = false; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    setAttribute(name, value) { attrs[name] = String(value); },
    getAttribute(name) { return attrs[name] === undefined ? null : String(attrs[name]); },
    removeAttribute(name) { delete attrs[name]; },
    click() {
      this.clicked++;
      if (typeof options.onClick === 'function') options.onClick(this);
    }
  };
  Object.assign(el, options.properties || {});
  return el;
}

function makeMedia(options) {
  options = Object.assign({
    tagName: 'AUDIO', src: 'https://cf-media.sndcdn.com/test.mp3', paused: true,
    ended: false, readyState: 4, currentTime: 0, duration: 100
  }, options || {});
  const media = element(options);
  Object.assign(media, options);
  media.play = options.play || (() => {
    media.paused = false;
    return Promise.resolve();
  });
  media.pause = options.pause || (() => { media.paused = true; });
  return media;
}

// Real media advances currentTime while playing; playback verification relies on it.
function advanceWhilePlaying(media) {
  const timer = setInterval(() => { if (!media.paused) media.currentTime += 0.05; }, 20);
  return () => clearInterval(timer);
}

function makeBroadcastChannelHub(messages) {
  const channels = [];
  return class SharedBroadcastChannel {
    constructor(name) {
      this.name = name;
      this.onmessage = null;
      channels.push(this);
    }

    postMessage(data) {
      if (messages) messages.push(data);
      channels.filter((channel) => channel !== this && channel.name === this.name).forEach((channel) => {
        if (typeof channel.onmessage === 'function') channel.onmessage({ data });
      });
    }

    close() {
      const at = channels.indexOf(this);
      if (at >= 0) channels.splice(at, 1);
    }
  };
}

function makeEnv(options) {
  options = options || {};
  const store = Object.assign({}, options.store || {});
  const listeners = Object.create(null);
  const windowListeners = Object.create(null);
  const posted = [];
  const ids = Object.create(null);
  const media = options.media || [];
  const selectors = options.selectors || {};
  const fetchCalls = [];
  const nativeFetch = options.fetch || (async () => new Response('{}', { status: 200 }));
  const localStorage = {
    getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? String(store[key]) : null; },
    setItem(key, value) { store[key] = String(value); },
    removeItem(key) { delete store[key]; }
  };
  const documentElement = element({ tagName: 'HTML' });
  documentElement.contains = (node) => !node || node.isConnected !== false;
  const document = {
    cookie: options.cookie || '',
    hidden: false,
    title: '',
    body: element({ tagName: 'BODY' }),
    documentElement,
    activeElement: null,
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    removeEventListener() {},
    dispatchEvent(event) { (listeners[event.type] || []).slice().forEach((fn) => fn(event)); },
    querySelector(selector) {
      if (Object.prototype.hasOwnProperty.call(selectors, selector)) {
        const value = selectors[selector];
        return typeof value === 'function' ? value() : value;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === 'audio,video' || selector === 'audio' || selector === 'video') return media;
      const value = selectors[selector];
      if (Array.isArray(value)) return value;
      if (value) return [typeof value === 'function' ? value() : value];
      return [];
    },
    getElementById(id) { return ids[id] || null; },
    createElement(tagName) {
      const out = element({ tagName });
      Object.defineProperty(out, 'id', {
        get() { return out.getAttribute('id'); },
        set(value) { out.setAttribute('id', value); ids[value] = out; }
      });
      return out;
    }
  };
  document.body.appendChild = function (child) {
    this.children.push(child);
    child.parentNode = this;
    if (child.id) ids[child.id] = child;
    return child;
  };

  const mediaSessionHandlers = Object.create(null);
  const mediaSession = options.mediaSession ? {
    metadata: null,
    setActionHandler(name, fn) {
      mediaSessionHandlers[name] = fn;
      if (typeof options.onMediaSessionHandler === 'function') options.onMediaSessionHandler(name, fn);
    },
    setPositionState() {}
  } : undefined;

  function FakeXHR() {}
  FakeXHR.prototype.open = function () {};
  FakeXHR.prototype.setRequestHeader = function () {};
  function FakeMediaElement() {}
  FakeMediaElement.prototype.play = function () {
    this.paused = false;
    return Promise.resolve();
  };

  const win = {
    location: { origin: 'https://soundcloud.com', pathname: options.pathname || '/discover', href: 'https://soundcloud.com' + (options.pathname || '/discover'), reload: options.onReload || (() => {}) },
    sessionStorage: {
      getItem(key) { return (options.sessionStore || {})[key] || null; },
      setItem(key, value) { if (options.sessionStore) options.sessionStore[key] = String(value); },
      removeItem(key) { if (options.sessionStore) delete options.sessionStore[key]; }
    },
    localStorage,
    navigator: { userAgent: 'runtime-test', language: 'en-US', locks: null, ...(mediaSession ? { mediaSession } : {}) },
    document,
    fetch: async function (...args) { fetchCalls.push(args); return nativeFetch(...args); },
    setTimeout,
    clearTimeout,
    setInterval: () => 0,
    clearInterval() {},
    addEventListener(type, fn) { (windowListeners[type] = windowListeners[type] || []).push(fn); },
    removeEventListener() {},
    dispatchEvent(event) { (windowListeners[event.type] || []).slice().forEach((fn) => fn(event)); },
    postMessage(message) { posted.push(message); },
    open() { return null; },
    history: { pushState() {} },
    URL,
    Event: function Event(type) { this.type = type; },
    MouseEvent: function MouseEvent(type, init) { this.type = type; Object.assign(this, init || {}); },
    Response,
    HTMLMediaElement: FakeMediaElement,
    XMLHttpRequest: FakeXHR,
    BroadcastChannel: options.BroadcastChannel || makeBroadcastChannelHub(),
    crypto: { randomUUID: () => options.tabId || 'tab-test' },
    MediaMetadata: function MediaMetadata(value) { Object.assign(this, value); },
    console: { log() {}, warn() {}, error() {} }
  };
  if (options.documentPictureInPicture) win.documentPictureInPicture = options.documentPictureInPicture;
  win.window = win;
  win.self = win;
  win.FreshDigI18n = i18n;
  win.FreshDigCore = core;
  const context = vm.createContext(win);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../list_backup.js'), 'utf8'), context, { filename: 'list_backup.js' });
  vm.runInContext(instrumentHook(), context, { filename: 'station_hook.runtime.js' });
  return { win, context, hooks: win.__runtimeHooks, store, listeners, windowListeners, posted, fetchCalls, mediaSessionHandlers, selectors, media };
}

function tick(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test('queued API gate rechecks robot state before sending the next request', async () => {
  let releaseFirst;
  let calls = 0;
  const first = new Promise((resolve) => { releaseFirst = resolve; });
  const env = makeEnv({
    fetch: async () => {
      calls++;
      if (calls === 1) return first;
      return new Response('{}', { status: 200 });
    }
  });
  const firstRequest = env.hooks.apiFetch('https://api-v2.soundcloud.com/one', {});
  await tick(0);
  const secondRequest = env.hooks.apiFetch('https://api-v2.soundcloud.com/two', {});
  await tick(0);
  assert.strictEqual(calls, 1, 'second request should remain queued behind the first');
  env.hooks.robotState.iframe = true;
  releaseFirst(new Response('{}', { status: 200 }));
  const [firstResponse, secondResponse] = await Promise.all([firstRequest, secondRequest]);
  assert.strictEqual(firstResponse.status, 200);
  assert.strictEqual(secondResponse.status, 503);
  assert.strictEqual(calls, 1, 'queued request must not cross an iframe robot check');
});

test('native API fetch challenge detection preserves the original response body', async () => {
  const body = '{"challenge":"DataDome"}';
  const env = makeEnv({
    fetch: async () => new Response(body, {
      status: 403,
      headers: { 'x-datadome': 'protected' }
    })
  });
  const response = await env.win.fetch('https://api-v2.soundcloud.com/tracks/1');
  assert.strictEqual(response.status, 403);
  assert.strictEqual(await response.text(), body, 'observer must consume only a clone');
  await tick(0);
  assert.strictEqual(env.hooks.robotState.api, true);
});

test('a successful native API response clears an observed API challenge', async () => {
  const env = makeEnv({ fetch: async () => new Response('{}', { status: 200 }) });
  env.hooks.robotState.api = true;
  await env.win.fetch('https://api-v2.soundcloud.com/me');
  assert.strictEqual(env.hooks.robotState.api, false);
  assert.strictEqual(env.hooks.state.robotBlocked, false);
});

test('ordinary own API calls remain paused after backoff, while the marked probe may run', async () => {
  let calls = 0;
  const env = makeEnv({ fetch: async () => { calls++; return new Response('{}', { status: 200 }); } });
  env.hooks.robotState.api = true;
  env.hooks.apiBackoff.ok();
  const ordinary = await env.hooks.apiFetch('https://api-v2.soundcloud.com/ordinary', {});
  assert.strictEqual(ordinary.status, 503);
  assert.strictEqual(calls, 0);
  const probe = await env.hooks.apiFetch('https://api-v2.soundcloud.com/me', { __freshDigRecoveryProbe: true });
  assert.strictEqual(probe.status, 200);
  assert.strictEqual(calls, 1);
});

test('robot recovery probe has one in-flight request and a cooldown', async () => {
  let calls = 0;
  const env = makeEnv({
    fetch: async () => {
      calls++;
      return new Response('{}', { status: 200 });
    }
  });
  env.hooks.state.clientId = 'client-id';
  env.hooks.robotState.api = true;
  env.hooks.robotRecovery.armed = true;
  env.hooks.apiBackoff.ok();
  env.hooks.probeRobotRecovery();
  env.hooks.probeRobotRecovery();
  await tick(10);
  assert.strictEqual(calls, 1);
  assert.strictEqual(env.hooks.robotRecovery.inFlight, false);
  env.hooks.probeRobotRecovery();
  await tick(10);
  assert.strictEqual(calls, 1, 'cooldown should prevent an immediate second probe');
});

test('pending native interaction blocks stale DOM reconciliation, then commits verified state', async () => {
  const like = element({ classes: [] });
  const title = element({ tagName: 'A', attrs: { href: '/artist/track' } });
  const env = makeEnv({
    selectors: {
      '.playbackSoundBadge__titleLink': title,
      '.playbackSoundBadge__lightLink': element({ tagName: 'A', attrs: { href: '/artist' } }),
      '.playbackSoundBadge__like': like
    }
  });
  env.hooks.state.currentTrack = { id: 42, artistId: 7, href: '/artist/track', title: 'Track' };
  env.hooks.state.likedTrackIds = new Set();
  const token = env.hooks.beginInteraction('like', 42, true);
  assert.strictEqual(env.hooks.getPendingInteraction('like', 42), token);
  // The poll's lexical sync state is initialized on the first call; two calls
  // after the one-second guard make the stale DOM overwrite observable.
  env.hooks.syncCurrentTrackInteractionsFromDom();
  await tick(1050);
  env.hooks.syncCurrentTrackInteractionsFromDom();
  assert.strictEqual(env.hooks.state.likedTrackIds.has(42), false);
  env.hooks.endInteraction(token);
  like.classList.add('sc-button-selected');
  env.hooks.syncCurrentTrackInteractionsFromDom();
  assert.strictEqual(env.hooks.state.likedTrackIds.has(42), true);
});

test('native like waits for stable DOM confirmation and clicks once', async () => {
  let clicks = 0;
  const like = element({ onClick(button) {
    clicks++;
    button.classList.add('sc-button-selected');
  } });
  const title = element({ tagName: 'A', attrs: { href: '/artist/track-43' } });
  const env = makeEnv({ selectors: {
    '.playbackSoundBadge__titleLink': title,
    '.playbackSoundBadge__like': like
  } });
  env.hooks.state.currentTrack = { id: 43, artistId: 7, href: '/artist/track-43', title: 'Track' };
  env.hooks.state.likedTrackIds = new Set();
  const result = await env.hooks.toggleLikeFromNative(() => {});
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.verified, true);
  assert.strictEqual(result.changed, true);
  assert.strictEqual(result.active, true);
  assert.strictEqual(clicks, 1);
  assert.strictEqual(env.hooks.state.likedTrackIds.has(43), true);
});

test('native interaction rejects a stale footer before clicking or mutating cache', async () => {
  let clicks = 0;
  const like = element({ onClick(button) {
    clicks++;
    button.classList.add('sc-button-selected');
  } });
  const staleTitle = element({ tagName: 'A', attrs: { href: '/artist/old-track' } });
  const env = makeEnv({ selectors: {
    '.playbackSoundBadge__titleLink': staleTitle,
    '.playbackSoundBadge__like': like
  } });
  env.hooks.state.currentTrack = { id: 46, artistId: 8, href: '/artist/current-track', title: 'Current' };
  env.hooks.state.likedTrackIds = new Set();
  const result = await env.hooks.toggleLikeFromNative(() => {});
  assert.strictEqual(result.success, false);
  assert.strictEqual(clicks, 0);
  assert.strictEqual(env.hooks.state.likedTrackIds.has(46), false);
});

test('native follow uses the current track id for verification and commits the artist state', async () => {
  let clicks = 0;
  const follow = element({ onClick(button) {
    clicks++;
    button.classList.add('sc-button-selected');
  } });
  const title = element({ tagName: 'A', attrs: { href: '/artist/track-44' } });
  const footer = element({ properties: {
    querySelector(selector) { return /follow/i.test(selector) ? follow : null; }
  } });
  const env = makeEnv({ selectors: {
    '.playbackSoundBadge__titleLink': title,
    '.playbackSoundBadge': footer,
    '.playbackSoundBadge__follow': follow,
    '.playbackSoundBadge__follow, .userBadge__follow, .profileHeader__followButton, button.sc-button-follow, button[data-testid="follow-button"], button[title*="Follow" i], button[aria-label*="Follow" i], button[title*="フォロー"]': follow
  } });
  env.hooks.state.currentTrack = { id: 44, artistId: 17, href: '/artist/track-44', title: 'Track', artistName: 'Artist' };
  env.hooks.state.followingUserIds = new Set();
  const result = await env.hooks.MP_ACTIONS.follow({}, () => {});
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.verified, true);
  assert.strictEqual(result.active, true);
  assert.strictEqual(clicks, 1);
  assert.strictEqual(env.hooks.state.followingUserIds.has(17), true);
});

test('unrelated global follow button does not reconcile the current artist state', async () => {
  const globalFollow = element({ classes: ['sc-button-selected'] });
  const title = element({ tagName: 'A', attrs: { href: '/artist/current-track' } });
  const footer = element({ properties: {
    querySelector() { return null; }
  } });
  const env = makeEnv({ selectors: {
    '.playbackSoundBadge__titleLink': title,
    '.playbackSoundBadge': footer,
    '.userBadge__follow': globalFollow,
    '.playbackSoundBadge__follow, .userBadge__follow, .profileHeader__followButton, button.sc-button-follow, button[data-testid="follow-button"], button[title*="Follow" i], button[aria-label*="Follow" i], button[title*="フォロー"]': globalFollow
  } });
  env.hooks.state.currentTrack = { id: 45, artistId: 18, href: '/artist/current-track', title: 'Current' };
  env.hooks.state.followingUserIds = new Set();
  env.hooks.syncCurrentTrackInteractionsFromDom();
  await tick(1050);
  env.hooks.syncCurrentTrackInteractionsFromDom();
  assert.strictEqual(env.hooks.state.followingUserIds.has(18), false);
  assert.strictEqual(globalFollow.clicked, 0);
});

test('remote command receipt is immediate and 1.7s completion is deduplicated', async () => {
  const messages = [];
  const BroadcastChannel = makeBroadcastChannelHub(messages);
  let actionCalls = 0;
  const target = makeEnv({ tabId: 'slow-target', BroadcastChannel });
  const remote = makeEnv({ tabId: 'slow-remote', BroadcastChannel });
  target.hooks.MP_ACTIONS.play = () => {
    actionCalls++;
    return new Promise((resolve) => setTimeout(() => resolve({ success: true, verified: true }), 1700));
  };
  remote.hooks.fdRemote.now = { tabId: target.hooks.TAB_ID, at: Date.now(), d: { playing: true } };

  const first = remote.hooks.mpRemoteCall('play', {});
  await tick(30);
  const command = messages.find((message) => message.type === 'cmd');
  assert.ok(command, 'remote action should send one command');
  assert.ok(messages.some((message) => message.type === 'cmd-received' && message.id === command.id),
    'target should acknowledge receipt before running the slow action');
  assert.strictEqual(messages.some((message) => message.type === 'cmd-ack' && message.id === command.id), false,
    'completion ACK must wait for the action result');

  const second = remote.hooks.mpRemoteCall('play', {});
  await tick(40);
  assert.strictEqual(actionCalls, 1, 'same target/action must not be retried while in flight');
  const [firstResult, secondResult] = await Promise.all([first, second]);
  assert.strictEqual(firstResult.success, true);
  assert.strictEqual(secondResult.success, true);
  assert.strictEqual(actionCalls, 1);
});

test('buffering pauses at readyState 0 and 1 cancel playback recovery intent', async () => {
  for (const readyState of [0, 1]) {
    let playCalls = 0;
    const media = makeMedia({ readyState, paused: true, play: () => {
      playCalls++;
      media.paused = false;
      return Promise.resolve();
    } });
    const env = makeEnv({ media: [media] });
    env.hooks.state.discoveryEnabled = true;
    env.hooks.state.currentTrack = { id: 57 + readyState, href: '/artist/buffering-' + readyState, title: 'Buffering' };
    env.hooks.playbackIntent.wanted = true;
    env.win.document.dispatchEvent({ type: 'pause', target: media });
    assert.strictEqual(env.hooks.playbackIntent.wanted, false, 'readyState ' + readyState + ' pause cancels intent');
    env.hooks.schedulePlaybackRecovery(media, 'waiting');
    await tick(430);
    assert.strictEqual(playCalls, 0, 'readyState ' + readyState + ' pause must not auto-resume');
  }
});

test('volume fallback dispatches native slider input and reports unsupported controls without mutating audio', () => {
  const sliderEvents = [];
  const slider = element({ properties: {
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 10 }; },
    dispatchEvent(event) {
      sliderEvents.push(event);
      // Simulate SoundCloud applying the native slider gesture. The runtime
      // must dispatch this gesture and read the resulting host-owned value.
      if (event.type === 'mousedown') nativeAudio.volume = 1 - event.clientY / 10;
      return true;
    }
  } });
  const nativeAudio = makeMedia({ volume: 0.64 });
  const supported = makeEnv({ media: [nativeAudio], selectors: { '.volume__sliderWrapper': slider } });
  const supportedResult = supported.hooks.setSoundCloudVolume(0.4);
  assert.strictEqual(supportedResult, 0.4);
  assert.ok(sliderEvents.length > 0, 'native slider should receive a dispatched input');
  assert.strictEqual(nativeAudio.volume, 0.4, 'the host slider, rather than direct runtime volume assignment, applies the value');

  const unsupportedAudio = makeMedia({ volume: 0.73 });
  const unsupported = makeEnv({ media: [unsupportedAudio] });
  const unavailableResult = unsupported.hooks.setSoundCloudVolume(0.2);
  assert.strictEqual(unavailableResult, null);
  assert.strictEqual(unsupportedAudio.volume, 0.73);
  const muteResult = unsupported.hooks.toggleSoundCloudMute();
  assert.strictEqual(muteResult.success, false);
  assert.notStrictEqual(muteResult.message, i18n.getTexts('ja').m_muted);
  assert.strictEqual(unsupportedAudio.volume, 0.73);
});

test('detached media registered through prototype play remains controllable', async () => {
  const env = makeEnv();
  const detached = Object.create(env.win.HTMLMediaElement.prototype);
  Object.assign(detached, {
    tagName: 'AUDIO',
    src: 'https://cf-media.sndcdn.com/detached.mp3',
    isConnected: false,
    paused: true,
    ended: false,
    readyState: 4,
    currentTime: 0,
    duration: 100
  });
  detached.pause = () => { detached.paused = true; };
  const stopClock = advanceWhilePlaying(detached);
  env.hooks.state.currentTrack = { id: 63, href: '/artist/detached', title: 'Detached' };
  await env.win.HTMLMediaElement.prototype.play.call(detached);
  assert.strictEqual(detached.paused, false);

  const pauseResult = await env.hooks.scTogglePlay(() => {});
  assert.strictEqual(pauseResult.success, true);
  assert.strictEqual(pauseResult.verified, true);
  assert.strictEqual(detached.paused, true);
  const playResult = await env.hooks.scTogglePlay(() => {});
  assert.strictEqual(playResult.success, true);
  assert.strictEqual(playResult.verified, true);
  assert.strictEqual(detached.paused, false);
  stopClock();
});

async function sendPopupAction(env, action, extra) {
  const payload = { type: 'SC_FRESH_STATION_POPUP_ACTION', action, requestId: 'test-' + action, ...(extra || {}) };
  const data = vm.runInContext('JSON.parse(' + JSON.stringify(JSON.stringify(payload)) + ')', env.context);
  const source = vm.runInContext('window', env.context);
  for (const listener of env.windowListeners.message || []) await listener({ source, data });
  return env.posted.find(message => message.requestId === payload.requestId)?.result;
}

test('heard ID caches have fixed bounds and current-session records do not skip themselves', () => {
  const env = makeEnv();
  for (let id = 100; id < 2300; id++) {
    env.hooks.heardCache(id, true);
    env.hooks.heardCache(id + 3000, false);
  }
  assert.strictEqual(env.hooks.state.heardTrackIds.size, 2000);
  assert.strictEqual(env.hooks.heardMisses.size, 2000);
  assert.strictEqual(env.hooks.state.heardTrackIds.has(100), false);
  env.hooks.state.discoveryEnabled = true;
  env.hooks.state.heardSkipEnabled = true;
  env.hooks.beginHeardSession(2299);
  assert.strictEqual(env.hooks.getCoreSkipReason({ id: 2299, artistId: 9 }), 'skipReasonHeard');
  env.hooks.heardPlayback.protected = true;
  assert.strictEqual(env.hooks.getCoreSkipReason({ id: 2299, artistId: 9 }), null);
  env.hooks.beginHeardSession(2300);
  env.hooks.beginHeardSession(2299);
  assert.strictEqual(env.hooks.getCoreSkipReason({ id: 2299, artistId: 9 }), 'skipReasonHeard', 'next session must consult history again');
});

test('a user pause or track skip during progress verification must not reload the page', async () => {
  let reloads = 0;
  const media = makeMedia({ paused: false });
  const env = makeEnv({ media: [media], onReload: () => { reloads++; } });
  env.hooks.state.currentTrack = { id: 90 };
  env.hooks.playbackIntent.wanted = true;
  const result = env.hooks.verifyAndRecoverExplicitPlay(media, 0);
  env.hooks.playbackIntent.wanted = false;
  assert.strictEqual((await result).cancelled, true);
  await tick(150);
  assert.strictEqual(reloads, 0);
});

test('playback reload waits for recovery window acknowledgement before navigation', async () => {
  let reloads = 0;
  const sessionStore = {};
  const env = makeEnv({ sessionStore, onReload: () => { reloads++; } });
  const source = vm.runInContext('window', env.context);
  const restore = vm.runInContext('({type:"SC_FRESH_STATION_RESTORE_STORAGE",data:{heardHistoryAvailable:true}})', env.context);
  for (const fn of env.windowListeners.message || []) await fn({ source, data: restore });
  env.win.__setTestMiniPlayer({ closed: false });
  env.hooks.state.currentTrack = { id: 95 };
  env.hooks.playbackIntent.wanted = true;
  const request = env.hooks.requestPlaybackPageReload('test');
  await tick(0);
  const arm = env.posted.find(m => m.type === 'SC_FRESH_STATION_ARM_RECOVERY_PLAYER');
  assert.ok(arm);
  assert.strictEqual(reloads, 0);
  const ack = vm.runInContext('JSON.parse(' + JSON.stringify(JSON.stringify({type:'SC_FRESH_STATION_ARM_RECOVERY_RESULT', requestId:arm.requestId, result:{ok:true}})) + ')', env.context);
  for (const fn of env.windowListeners.message || []) await fn({ source, data: ack });
  assert.strictEqual(await request, true);
  assert.strictEqual(JSON.parse(sessionStore.sc_fresh_station_miniplayer_restore_v1).wanted, true);
  await tick(150);
  assert.strictEqual(reloads, 1);
});

test('pausing during recovery-window setup cancels the pending reload', async () => {
  let reloads = 0;
  const sessionStore = {};
  const env = makeEnv({ sessionStore, onReload: () => { reloads++; } });
  const source = vm.runInContext('window', env.context);
  for (const fn of env.windowListeners.message || []) await fn({ source, data: {type:'SC_FRESH_STATION_RESTORE_STORAGE',data:{heardHistoryAvailable:true}} });
  env.win.__setTestMiniPlayer({ closed: false });
  env.hooks.state.currentTrack = { id: 96 };
  env.hooks.playbackIntent.wanted = true;
  const request = env.hooks.requestPlaybackPageReload('test');
  const arm = env.posted.find(m => m.type === 'SC_FRESH_STATION_ARM_RECOVERY_PLAYER');
  env.hooks.playbackIntent.wanted = false;
  env.hooks.playbackIntent.pauseRevision = 1;
  for (const fn of env.windowListeners.message || []) await fn({ source, data: {type:'SC_FRESH_STATION_ARM_RECOVERY_RESULT',requestId:arm.requestId,result:{ok:true}} });
  assert.strictEqual(await request, false);
  await tick(150);
  assert.strictEqual(reloads, 0);
  assert.strictEqual(sessionStore.sc_fresh_station_miniplayer_restore_v1, undefined);
});

test('reload restoration uses the extension window and respects a new user pause', async () => {
  let plays = 0;
  let pipRequests = 0;
  const sessionStore = {};
  const media = makeMedia({ play: () => { plays++; return Promise.resolve(); } });
  const env = makeEnv({ media: [media], sessionStore,
    documentPictureInPicture: { requestWindow() { pipRequests++; throw Object.assign(new Error(), {name:'NotAllowedError'}); } } });
  const source = vm.runInContext('window', env.context);
  for (const fn of env.windowListeners.message || []) await fn({ source, data: {type:'SC_FRESH_STATION_RESTORE_STORAGE',data:{heardHistoryAvailable:true}} });
  env.hooks.state.currentTrack = { id: 97 };
  sessionStore.sc_fresh_station_miniplayer_restore_v1 = JSON.stringify({ at:Date.now(), trackKey:'97', wanted:true });
  env.hooks.restoreMiniPlayerAfterReload();
  await tick(950);
  const arm = env.posted.find(m => m.type === 'SC_FRESH_STATION_ARM_RECOVERY_PLAYER');
  assert.ok(arm);
  env.hooks.playbackIntent.pauseRevision = 1;
  for (const fn of env.windowListeners.message || []) await fn({ source, data: {type:'SC_FRESH_STATION_ARM_RECOVERY_RESULT',requestId:arm.requestId,result:{ok:true}} });
  await tick(0);
  assert.strictEqual(pipRequests, 0, 'timer-based PiP must not require forbidden activation');
  assert.strictEqual(plays, 0, 'user pause after reload wins over persisted intent');
  assert.ok(env.win.document.getElementById('sc-fresh-station-mp-launch'));
});

test('four-list backup reads exclusions without network and additive import preserves existing records', async () => {
  const env = makeEnv();
  vm.runInContext('__runtimeHooks.state.dislikedTracks = { "1": {title: "Existing"} }', env.context);
  const beforeFetches = env.fetchCalls.length;
  const snapshot = await sendPopupAction(env, 'GET_LISTS');
  assert.equal(snapshot.success, true);
  assert.equal(snapshot.lists.dislikedTracks['1'].title, 'Existing');
  assert.equal(env.fetchCalls.length, beforeFetches);
  const result = await sendPopupAction(env, 'IMPORT_EXCLUSIONS', { lists: { laterArtists: [],
    dislikedTracks: { '1': {title: 'Do not overwrite'}, '2': {title: 'New'} },
    dislikedArtists: { '3': {name: 'Artist'} }, dislikedGenres: { rock: true }
  } });
  assert.equal(result.success, true);
  assert.equal(env.hooks.state.dislikedTracks['1'].title, 'Existing');
  assert.equal(env.hooks.state.dislikedTracks['2'].title, 'New');
  const stored = JSON.parse(env.store.sc_fresh_station_data_v1);
  assert.equal(stored.dislikedArtists['3'].name, 'Artist');
  assert.equal(stored.dislikedGenres.rock, true);
  assert.equal(env.fetchCalls.length, beforeFetches, 'local list import must not write to SoundCloud');
});

test('invalid list input or a quota error cannot change the live exclusion maps', async () => {
  for (const mode of ['invalid', 'quota']) {
    const env = makeEnv();
    vm.runInContext('__runtimeHooks.state.dislikedTracks = { "1": true }', env.context);
    if (mode === 'quota') {
      const originalSet = env.win.localStorage.setItem;
      env.win.localStorage.setItem = (key, value) => {
        if (key === 'sc_fresh_station_data_v1') throw new Error('QuotaExceededError');
        originalSet(key, value);
      };
    }
    const lists = mode === 'invalid' ? { unrelated: 'not-a-backup' } : {
      laterArtists: [], dislikedTracks: { '2': true }, dislikedArtists: {}, dislikedGenres: {}
    };
    const result = await sendPopupAction(env, 'IMPORT_EXCLUSIONS', { lists });
    assert.equal(result.success, false, mode);
    assert.equal(env.hooks.state.dislikedTracks['1'], true);
    assert.equal(env.hooks.state.dislikedTracks['2'], undefined);
  }
});

test('backup and import read an exclusion saved by another tab before its notification arrives', async () => {
  const env = makeEnv();
  vm.runInContext('__runtimeHooks.state.dislikedTracks = { "1": true }', env.context);
  env.store.sc_fresh_station_data_v1 = JSON.stringify({ dislikedTracks: { '1': true, '9': { title: 'Other tab' } },
    dislikedArtists: { '8': { name: 'Other artist' } }, dislikedGenres: { ambient: true } });
  const snapshot = await sendPopupAction(env, 'GET_LISTS');
  assert.equal(snapshot.lists.dislikedTracks['9'].title, 'Other tab');
  assert.equal(snapshot.lists.dislikedGenres.ambient, true);
  const result = await sendPopupAction(env, 'IMPORT_EXCLUSIONS', { lists: { laterArtists: [],
    dislikedTracks: { '2': { title: 'Imported' } }, dislikedArtists: {}, dislikedGenres: {} } });
  assert.equal(result.success, true);
  const stored = JSON.parse(env.store.sc_fresh_station_data_v1);
  assert.equal(stored.dislikedTracks['9'].title, 'Other tab');
  assert.equal(stored.dislikedTracks['2'].title, 'Imported');
  assert.equal(stored.dislikedArtists['8'].name, 'Other artist');
  assert.equal(stored.dislikedGenres.ambient, true);
});

test('followed author Tracks page keeps their known tracks while unrelated and explicit exclusions still apply', () => {
  const env = makeEnv({ pathname: '/followed-artist/tracks' });
  const h = env.hooks;
  h.state.discoveryEnabled = true;
  h.state.playbackMode = 'DISCOVERY';
  h.state.followingUserIds = new Set([7, 8]);
  h.state.likedTrackIds = new Set([10]);
  const own = { id: 10, artistId: 7, artistPermalink: 'followed-artist', href: '/followed-artist/song' };
  h.state.currentTrack = own;
  assert.equal(h.getCoreSkipReason(own), null);
  assert.deepEqual(h.filterStationTracks([
    { id: 10, user: { id: 7, permalink: 'followed-artist' } },
    { id: 11, user: { id: 8, permalink: 'other-artist' } }
  ]).map(track => track.id), [10], 'station filtering preserves the same author identity');
  assert.equal(h.getCoreSkipReason({ id: 11, artistId: 8, artistPermalink: 'other-artist' }), 'skipReasonFollowing');
  h.state.dislikedTracks[10] = true;
  assert.equal(h.getCoreSkipReason(own), 'skipReasonDisliked', 'explicit NoPlay remains active');
  delete h.state.dislikedTracks[10];
  for (const pathname of ['/discover', '/followed-artist/reposts', '/other-artist/tracks']) {
    env.win.location.pathname = pathname;
    assert.equal(h.getCoreSkipReason(own), 'skipReasonLiked', pathname);
  }
  env.win.location.pathname = '/followed-artist/tracks';
  assert.equal(h.getCoreSkipReason({ id: 12, artistId: 7 }), 'skipReasonFollowing', 'missing author permalink must not inherit the page identity');
  assert.equal(h.state.discoveryEnabled, true);
});

test('entering a followed author page cancels only obsolete known-track skips without resuming user pauses', async () => {
  for (const reason of ['skipReasonFollowing', 'skipReasonLiked']) {
    for (const userPaused of [false, true]) {
      const media = makeMedia({ paused: false });
      const env = makeEnv({ media: [media] });
      const h = env.hooks;
      const track = { id: 17, artistId: 7, artistPermalink: 'followed-artist', href: '/followed-artist/song' };
      h.state.currentTrack = track;
      h.state.discoveryEnabled = true;
      h.state.followingUserIds = new Set([7]);
      if (reason === 'skipReasonLiked') h.state.likedTrackIds = new Set([17]);
      h.playbackIntent.wanted = true;
      h.rememberPlaybackMedia(media);
      let nextCount = 0;
      h.scInternals.req = { c: { playback: { exports: {
        playNext() { nextCount++; }, playPrev() {}, getCurrentSound: () => ({ id: 17 }),
        pauseCurrent() { media.paused = true; env.win.document.dispatchEvent({ type: 'pause', target: media }); }
      } } } };
      h.skipPacing.nextAt = Date.now() + 80;
      h.doAutoSkip(reason, track);
      assert.equal(media.paused, true);
      if (userPaused) env.win.document.dispatchEvent({ type: 'pause', target: media });
      env.win.location.pathname = '/followed-artist/tracks';
      await tick(160);
      assert.equal(nextCount, 0);
      assert.equal(media.paused, userPaused);
      assert.equal(h.state.discoveryEnabled, true);
    }
  }
});

test('saved author listening exemption matches both page and track author without changing Dig preference', () => {
  const env = makeEnv({ pathname: '/saved-artist/tracks' });
  const h = env.hooks;
  h.state.discoveryEnabled = true;
  h.state.playbackMode = 'DISCOVERY';
  h.laterState.map = { '7': { artistId: '7', permalink: 'saved-artist' }, '8': { artistId: '8', permalink: 'another-artist' } };
  const own = { id: 10, artistId: 7, title: 'Intentional listening', stats: { followers: 9999 } };
  h.state.currentTrack = own;
  h.state.dislikedTracks[10] = true;
  h.state.freshFilter.followers = { on: true, n: 1 };
  assert.equal(h.isOnLaterArtistPage(own), true);
  assert.equal(h.getSkipReason(own), null);
  assert.equal(h.getSkipReason({ id: 11, artistId: 8 }), 'skipReasonLater', 'another artist on the same page stays excluded');
  env.win.location.pathname = '/saved-artist/a-track';
  assert.equal(h.getSkipReason(own), null, 'individual track pages also allow intentional listening');
  env.win.location.pathname = '/discover';
  assert.equal(h.getSkipReason(own), 'skipReasonDisliked');
  assert.equal(h.state.discoveryEnabled, true, 'the saved preference must stay ON');
});

test('entering a saved author page cancels the pending skip and releases only its owned pause', async () => {
  for (const userPaused of [false, true]) {
    const media = makeMedia({ paused: false });
    const env = makeEnv({ media: [media] });
    const h = env.hooks;
    const track = { id: 17, artistId: 7, title: 'Saved', href: '/saved-artist/track' };
    h.state.currentTrack = track;
    h.state.discoveryEnabled = true;
    h.laterState.map = { '7': { artistId: '7', permalink: 'saved-artist' } };
    h.playbackIntent.wanted = true;
    h.rememberPlaybackMedia(media);
    h.scInternals.req = { c: { playback: { exports: {
      playNext() {}, playPrev() {}, getCurrentSound: () => ({ id:17 }),
      pauseCurrent() { media.paused = true; env.win.document.dispatchEvent({ type:'pause', target:media }); }
    } } } };
    h.skipPacing.nextAt = Date.now() + 80;
    h.doAutoSkip('skipReasonLater', track);
    assert.equal(media.paused, true);
    if (userPaused) env.win.document.dispatchEvent({ type:'pause', target:media });
    env.win.location.pathname = '/saved-artist/tracks';
    await tick(140);
    assert.equal(media.paused, userPaused, 'resume only when no user pause intervened');
  }
});

test('Later artists are applied to station filtering and immediate skip decisions', () => {
  const env = makeEnv();
  env.hooks.state.discoveryEnabled = true;
  env.hooks.state.playbackMode = 'DISCOVERY';
  env.hooks.laterState.map = { '7': { artistId: '7', name: 'Later Artist', permalink: 'later-artist' } };
  assert.strictEqual(env.hooks.getCoreSkipReason({ id: 10, artistId: 7, title: 'saved' }), 'skipReasonLater');
  const filtered = env.hooks.filterStationTracks([
    { id: 10, user: { id: 7, username: 'later-artist' }, title: 'saved' },
    { id: 11, user: { id: 8, username: 'other' }, title: 'keep' }
  ]);
  assert.deepStrictEqual(filtered.map((track) => track.id), [11]);
  env.hooks.state.discoveryEnabled = false;
  assert.strictEqual(env.hooks.getCoreSkipReason({ id: 10, artistId: 7 }), null);
});

test('mini-player launcher exists before playback controls and migrates without a duplicate ID', () => {
  const env = makeEnv();
  env.hooks.injectButtons();
  const launcher = env.win.document.getElementById('sc-fresh-station-miniplayer-btn');
  assert.ok(launcher);
  const fallback = env.win.document.getElementById('sc-fresh-station-miniplayer-fallback');
  assert.strictEqual(launcher.parentNode, fallback);

  const host = element({ tagName: 'DIV' });
  host.querySelector = () => null;
  env.selectors['.playControls__elements'] = host;
  env.hooks.injectButtons();
  const migrated = env.win.document.getElementById('sc-fresh-station-miniplayer-btn');
  assert.strictEqual(migrated, launcher);
  assert.strictEqual(migrated.parentNode.id, 'sc-fresh-station-bar');
  assert.strictEqual(fallback.isConnected, false);
});

test('Auto-PiP diagnostics report registration capability truthfully', () => {
  const handlers = [];
  let requestCount = 0;
  const supported = makeEnv({
    mediaSession: true,
    documentPictureInPicture: { requestWindow: async () => { requestCount++; return {}; } },
    onMediaSessionHandler(name, fn) { if (name === 'enterpictureinpicture') handlers.push(fn); }
  });
  assert.deepStrictEqual({ ...supported.hooks.getAutoPipDiagnostics() }, {
    autoPipSupported: true,
    autoPipStatus: 'registered',
    autoPipLastError: null
  });
  supported.hooks.registerAutoMiniPlayerHandler();
  assert.strictEqual(handlers.length, 1, 'registration should not repeat on a status poll');
  supported.hooks.setAutoMiniPlayer(false, { noSync: true });
  assert.strictEqual(supported.hooks.getAutoPipDiagnostics().autoPipSupported, true);
  handlers[0]({ enterPictureInPictureReason: 'background' });
  assert.strictEqual(requestCount, 0, 'OFF must leave the registered callback inert');
  supported.hooks.setAutoMiniPlayer(true, { noSync: true });
  assert.strictEqual(handlers.length, 1, 'turning ON should reuse the registered callback');

  const unsupported = makeEnv({ mediaSession: true });
  assert.deepStrictEqual({ ...unsupported.hooks.getAutoPipDiagnostics() }, {
    autoPipSupported: false,
    autoPipStatus: 'unsupported',
    autoPipLastError: null
  });
});

test('stall recovery is bounded and does not resume an intentional pause', async () => {
  let playCalls = 0;
  const media = makeMedia({
    paused: true,
    play: () => {
      playCalls++;
      media.paused = false;
      return Promise.resolve();
    }
  });
  const env = makeEnv({ media: [media] });
  env.hooks.state.discoveryEnabled = true;
  env.hooks.state.currentTrack = { id: 55, href: '/artist/track-55', title: 'Track' };
  env.hooks.playbackIntent.wanted = true;
  env.win.document.dispatchEvent({ type: 'pause', target: media });
  assert.strictEqual(env.hooks.playbackIntent.wanted, false);
  env.hooks.schedulePlaybackRecovery(media, 'stalled');
  await tick(430);
  assert.strictEqual(playCalls, 0, 'a user pause must cancel automatic recovery');

  env.hooks.playbackIntent.wanted = true;
  media.paused = true;
  env.hooks.schedulePlaybackRecovery(media, 'stalled');
  await tick(430);
  assert.strictEqual(playCalls, 1);
  env.hooks.schedulePlaybackRecovery(media, 'stalled');
  await tick(430);
  assert.strictEqual(playCalls, 1, 'recovery is paced per track');

  env.hooks.playbackIntent.wanted = true;
  env.hooks.playbackIntent.recoveries = 0;
  env.hooks.playbackIntent.lastRecoveryAt = 0;
  media.ended = true;
  env.hooks.schedulePlaybackRecovery(media, 'ended');
  await tick(800);
  assert.strictEqual(playCalls, 1, 'ended recovery must stay bounded when no native queue is available');
});

test('a pending recovery play must not pause buffering audio or cancel the user playback intent', async () => {
  let pauses = 0;
  let plays = 0;
  const media = makeMedia({ paused: false, readyState: 2, currentTime: 35,
    play() { plays++; return new Promise(() => {}); },
    pause() { pauses++; media.paused = true; env.win.document.dispatchEvent({ type: 'pause', target: media }); }
  });
  const env = makeEnv({ media: [media] });
  const h = env.hooks;
  h.state.discoveryEnabled = true;
  h.state.currentTrack = { id: 71, href: '/artist/buffering', title: 'Buffering' };
  h.playbackIntent.wanted = true;
  h.schedulePlaybackRecovery(media, 'waiting');
  await tick(1150);
  assert.equal(plays, 1);
  assert.equal(pauses, 0, 'a bounded recovery wait must not stop SoundCloud buffering');
  assert.equal(media.paused, false);
  assert.equal(h.playbackIntent.wanted, true);
  assert.equal(h.playbackIntent.recoveryInFlight, false, 'the command must still settle within its time limit');
  const result = h.getDiagLogEntries().find(entry => entry.type === 'playback-recovery-result');
  assert.equal(result.detail.outcome, 'PlayTimeout');
  assert.equal(result.detail.playback.paused, false);
  assert.equal(result.detail.playback.wanted, true);
  assert.equal(result.detail.playback.readyState, 2);
});

test('natural end keeps play intent through the pause event for one bounded next-track attempt', async () => {
  let nextCalls = 0;
  const media = makeMedia({ paused: true, ended: true, readyState: 4 });
  const env = makeEnv({ media: [media] });
  env.hooks.state.discoveryEnabled = true;
  env.hooks.state.currentTrack = { id: 56, href: '/artist/track-56', title: 'Ended' };
  env.hooks.playbackIntent.wanted = true;
  env.hooks.scInternals.req = { c: { playback: { exports: {
    playNext: () => { nextCalls++; },
    playPrev: () => {},
    getCurrentSound: () => null,
    pauseCurrent: () => {}
  } } } };
  env.win.document.dispatchEvent({ type: 'pause', target: media });
  assert.strictEqual(env.hooks.playbackIntent.wanted, true, 'natural end pause must not cancel intent');
  env.win.document.dispatchEvent({ type: 'ended', target: media });
  await tick(1000);
  assert.strictEqual(nextCalls, 1, 'natural end recovery advances at most once');
});

test('play command reports rejected and never-resolving media play without a retry', async () => {
  let rejectedCalls = 0;
  const rejectedMedia = makeMedia({
    play: () => {
      rejectedCalls++;
      return Promise.reject({ name: 'NotAllowedError' });
    }
  });
  const rejected = makeEnv({ media: [rejectedMedia] });
  rejected.hooks.state.currentTrack = { id: 61, href: '/artist/track-61', title: 'Rejected' };
  const rejectedResult = await rejected.hooks.scTogglePlay(() => {});
  assert.strictEqual(rejectedResult.success, false);
  assert.strictEqual(rejectedResult.message, 'NotAllowedError');
  assert.strictEqual(rejectedCalls, 1);

  let pendingCalls = 0;
  const pendingMedia = makeMedia({
    play: () => {
      pendingCalls++;
      return new Promise(() => {});
    }
  });
  const pending = makeEnv({ media: [pendingMedia] });
  pending.hooks.state.currentTrack = { id: 62, href: '/artist/track-62', title: 'Pending' };
  const pendingResult = await pending.hooks.scTogglePlay(() => {});
  assert.strictEqual(pendingResult.success, false);
  assert.strictEqual(pendingResult.message, 'PlayTimeout');
  assert.strictEqual(pendingCalls, 1, 'a timed-out play must not trigger a second toggle');
});

test('remote play ACK waits for target tab playback and returns verified result', async () => {
  const messages = [];
  const BroadcastChannel = makeBroadcastChannelHub(messages);
  let releasePlay;
  let playCalls = 0;
  const playGate = new Promise((resolve) => { releasePlay = resolve; });
  const media = makeMedia({
    play: () => {
      playCalls++;
      return playGate.then(() => { media.paused = false; });
    }
  });
  const stopClock = advanceWhilePlaying(media);
  const target = makeEnv({ tabId: 'target', BroadcastChannel, media: [media] });
  const remote = makeEnv({ tabId: 'remote', BroadcastChannel });
  target.hooks.state.discoveryEnabled = true;
  target.hooks.state.currentTrack = { id: 91, href: '/artist/track-91', title: 'remote track' };
  remote.hooks.fdRemote.now = { tabId: target.hooks.TAB_ID, at: Date.now(), d: { playing: true } };
  const action = remote.hooks.mpRemoteCall('play', {});
  await tick(30);
  assert.strictEqual(playCalls, 1);
  let settled = false;
  action.then(() => { settled = true; });
  await tick(30);
  assert.strictEqual(settled, false, 'ACK must wait for play() and local verification');
  releasePlay();
  const result = await action;
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.verified, true);
  assert.strictEqual(result.playing, true);
  assert.strictEqual(playCalls, 1, 'remote play must not retry or double-toggle');
  stopClock();
});

