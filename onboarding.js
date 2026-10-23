(function () {
  'use strict';

  const HOST_ID = 'sc-fresh-onboarding-host';
  const LAUNCHER_ID = 'sc-fresh-station-miniplayer-btn';
  const PANEL_COUNT = 3;

  const FALLBACK_TEXTS = {
    onboardingDialogLabel: 'FreshDig guide',
    onboardingTitle: 'How FreshDig works',
    onboardingStep1Title: 'Open the Mini Player',
    onboardingStep1Body: 'FreshDig’s standout feature. Open it from the extension icon or SoundCloud’s 📻 button.',
    onboardingStep2Title: 'Dig ON Mode',
    onboardingStep2Body: 'When ON, skips NoPlay tracks, liked tracks, and tracks by artists you follow.',
    onboardingStep3Title: '🧐 Listen Later List',
    onboardingStep3Body: 'Save an artist with 🧐 in the bottom row. Open the list from the extension icon, then select an artist to open their tracks page.',
    onboardingOpenLauncher: '📻 Open the page launcher',
    onboardingLauncherHint: 'Click the 📻 in the player controls on the SoundCloud page.',
    onboardingNext: 'Next',
    onboardingBack: 'Back',
    onboardingDone: 'Start using FreshDig',
    onboardingSkip: 'Skip guide',
    onboardingClose: 'Close',
    onboardingProgress: '{n} / 3'
  };

  let guide = null;

  function getTexts(language) {
    try {
      if (typeof FreshDigI18n !== 'undefined' && FreshDigI18n.getTexts) {
        return FreshDigI18n.getTexts(language);
      }
    } catch (e) {}
    return FALLBACK_TEXTS;
  }

  function storageGet(keys, callback) {
    if (!chrome.storage || !chrome.storage.local || !chrome.storage.local.get) return;
    try {
      chrome.storage.local.get(keys, function (values) {
        if (chrome.runtime && chrome.runtime.lastError) return;
        callback(values || {});
      });
    } catch (e) {}
  }

  function storageSet(values) {
    if (!chrome.storage || !chrome.storage.local || !chrome.storage.local.set) return;
    try { chrome.storage.local.set(values, function () {}); } catch (e) {}
  }

  function makeElement(tag, className) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
  }

  function formatProgress(text, step) {
    return String(text || FALLBACK_TEXTS.onboardingProgress).replace('{n}', String(step));
  }

  function showGuide(language) {
    if (guide || document.getElementById(HOST_ID) || !document.body) return;

    const host = makeElement('div');
    host.id = HOST_ID;
    host.setAttribute('data-onboarding-target', '#' + LAUNCHER_ID);
    host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483646;pointer-events:none;';
    if (!host.attachShadow) return;
    const shadow = host.attachShadow({ mode: 'open' });

    const style = makeElement('style');
    style.textContent = [
      ':host{all:initial}',
      '.fd-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.72);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#f4f4f4;pointer-events:auto}',
      '.fd-dialog{position:relative;z-index:1;width:min(420px,calc(100vw - 28px));max-height:calc(100vh - 36px);overflow:auto;background:#1e1e1e;border:1px solid #555;border-radius:12px;box-shadow:0 12px 42px rgba(0,0,0,.65);padding:20px;color:#f4f4f4}',
      '.fd-header{display:flex;align-items:flex-start;gap:12px;margin-bottom:14px}',
      '.fd-heading{flex:1;min-width:0}',
      '.fd-kicker{margin:0 0 4px;color:#ff9a55;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}',
      'h1{margin:0;font-size:22px;line-height:1.2}',
      '.fd-close{flex:0 0 auto;width:32px;height:32px;padding:0;background:transparent;border:1px solid #666;border-radius:6px;color:#ddd;font-size:22px;line-height:1;cursor:pointer}',
      '.fd-close:hover{border-color:#ff7700;color:#fff}',
      '.fd-progress{margin:0 0 18px;color:#aaa;font-size:11px}',
      '.fd-panel{min-height:170px}',
      '.fd-panel h2{margin:0 0 10px;color:#ffb36b;font-size:18px;line-height:1.25}',
      '.fd-panel p{margin:0;color:#ddd;font-size:14px;line-height:1.55}',
      '.fd-launch{margin-top:18px;padding:10px 13px;background:#2a201b;border:1px solid #ff5500;border-radius:7px;color:#ffb36b;font-size:13px;font-weight:700;cursor:pointer}',
      '.fd-launch:hover{background:#ff5500;color:#fff}',
      '.fd-hint{margin:8px 0 0;color:#999;font-size:11px;line-height:1.4}',
      '.fd-footer{display:flex;align-items:center;gap:8px;margin-top:18px}',
      '.fd-footer button{padding:8px 11px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer}',
      '.fd-back{background:#292929;border:1px solid #555;color:#ccc}',
      '.fd-next{flex:1;background:#ff5500;border:1px solid #ff5500;color:#fff}',
      '.fd-skip{margin-left:auto;background:transparent;border:0;color:#aaa;text-decoration:underline}',
      '.fd-footer button:hover{filter:brightness(1.15)}',
      '.fd-footer button:focus-visible,.fd-close:focus-visible,.fd-launch:focus-visible{outline:2px solid #ffd166;outline-offset:2px}',
      '.fd-spotlight{position:fixed;z-index:0;border:3px solid #ff9a55;border-radius:8px;box-shadow:0 0 0 5px rgba(255,154,85,.35),0 0 0 9999px rgba(0,0,0,.46);pointer-events:none;transition:left .12s ease,top .12s ease,width .12s ease,height .12s ease}',
      '[hidden]{display:none!important}',
      '@media (prefers-reduced-motion:reduce){.fd-spotlight{transition:none}}'
    ].join('');
    shadow.appendChild(style);

    const overlay = makeElement('div', 'fd-overlay');
    const dialog = makeElement('section', 'fd-dialog');
    dialog.id = 'sc-fresh-onboarding-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.tabIndex = -1;

    const header = makeElement('div', 'fd-header');
    const heading = makeElement('div', 'fd-heading');
    const kicker = makeElement('p', 'fd-kicker');
    const title = makeElement('h1');
    title.id = 'sc-fresh-onboarding-title';
    heading.appendChild(kicker);
    heading.appendChild(title);
    const close = makeElement('button', 'fd-close');
    close.type = 'button';
    close.textContent = '×';
    header.appendChild(heading);
    header.appendChild(close);
    dialog.setAttribute('aria-labelledby', title.id);
    dialog.appendChild(header);

    const progress = makeElement('p', 'fd-progress');
    progress.setAttribute('aria-live', 'polite');
    dialog.appendChild(progress);

    const panelHost = makeElement('div');
    const panels = [];
    const panelTitles = ['onboardingStep1Title', 'onboardingStep2Title', 'onboardingStep3Title'];
    const panelBodies = ['onboardingStep1Body', 'onboardingStep2Body', 'onboardingStep3Body'];
    panelTitles.forEach(function (titleKey, index) {
      const panel = makeElement('section', 'fd-panel');
      panel.id = 'sc-fresh-onboarding-panel-' + (index + 1);
      panel.setAttribute('role', 'group');
      panel.tabIndex = -1;
      const panelTitle = makeElement('h2');
      const panelBody = makeElement('p');
      panelTitle.id = 'sc-fresh-onboarding-panel-title-' + (index + 1);
      panel.setAttribute('aria-labelledby', panelTitle.id);
      panel.appendChild(panelTitle);
      panel.appendChild(panelBody);
      if (index === 0) {
        const openLauncher = makeElement('button', 'fd-launch');
        openLauncher.type = 'button';
        const launcherHint = makeElement('p', 'fd-hint');
        panel.appendChild(openLauncher);
        panel.appendChild(launcherHint);
        panel._openLauncher = openLauncher;
        panel._launcherHint = launcherHint;
      }
      panel._title = panelTitle;
      panel._body = panelBody;
      panelHost.appendChild(panel);
      panels.push(panel);
    });
    dialog.appendChild(panelHost);

    const footer = makeElement('div', 'fd-footer');
    const back = makeElement('button', 'fd-back');
    back.type = 'button';
    const next = makeElement('button', 'fd-next');
    next.type = 'button';
    const skip = makeElement('button', 'fd-skip');
    skip.type = 'button';
    footer.appendChild(back);
    footer.appendChild(next);
    footer.appendChild(skip);
    dialog.appendChild(footer);

    const spotlight = makeElement('div', 'fd-spotlight');
    spotlight.setAttribute('aria-hidden', 'true');
    spotlight.hidden = true;
    overlay.appendChild(spotlight);
    overlay.appendChild(dialog);
    shadow.appendChild(overlay);
    document.body.appendChild(host);

    const previousFocus = document.activeElement;
    guide = {
      host: host,
      dialog: dialog,
      title: title,
      kicker: kicker,
      progress: progress,
      panels: panels,
      close: close,
      back: back,
      next: next,
      skip: skip,
      spotlight: spotlight,
      language: language || 'auto',
      step: 0,
      previousFocus: previousFocus,
      observer: null,
      interval: null
    };

    function applyLanguage() {
      if (!guide) return;
      const tx = getTexts(guide.language);
      guide.dialog.setAttribute('aria-label', tx.onboardingDialogLabel);
      guide.kicker.textContent = tx.onboardingDialogLabel;
      guide.title.textContent = tx.onboardingTitle;
      guide.close.setAttribute('aria-label', tx.onboardingClose);
      guide.back.textContent = tx.onboardingBack;
      guide.next.textContent = guide.step === PANEL_COUNT - 1 ? tx.onboardingDone : tx.onboardingNext;
      guide.skip.textContent = tx.onboardingSkip;
      guide.progress.textContent = formatProgress(tx.onboardingProgress, guide.step + 1);
      guide.panels.forEach(function (panel, index) {
        panel._title.textContent = tx[panelTitles[index]];
        panel._body.textContent = tx[panelBodies[index]];
        if (panel._openLauncher) panel._openLauncher.textContent = tx.onboardingOpenLauncher;
        if (panel._launcherHint) panel._launcherHint.textContent = tx.onboardingLauncherHint;
      });
    }

    function focusables() {
      const list = [guide.close, guide.back, guide.next, guide.skip];
      const activePanel = guide.panels[guide.step];
      if (activePanel && activePanel._openLauncher) list.splice(1, 0, activePanel._openLauncher);
      return list.filter(function (element) { return element && !element.hidden && !element.disabled; });
    }

    function updateSpotlight() {
      if (!guide || guide.step !== 0) {
        if (guide) guide.spotlight.hidden = true;
        return;
      }
      const target = document.getElementById(LAUNCHER_ID);
      if (!target) {
        guide.spotlight.hidden = true;
        return;
      }
      const rect = target.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        guide.spotlight.hidden = true;
        return;
      }
      const pad = 6;
      guide.spotlight.hidden = false;
      guide.spotlight.style.left = Math.max(0, rect.left - pad) + 'px';
      guide.spotlight.style.top = Math.max(0, rect.top - pad) + 'px';
      guide.spotlight.style.width = rect.width + pad * 2 + 'px';
      guide.spotlight.style.height = rect.height + pad * 2 + 'px';
    }

    function renderStep(shouldFocus) {
      if (!guide) return;
      guide.panels.forEach(function (panel, index) {
        const active = index === guide.step;
        panel.hidden = !active;
        panel.setAttribute('aria-hidden', String(!active));
      });
      const tx = getTexts(guide.language);
      guide.progress.textContent = formatProgress(tx.onboardingProgress, guide.step + 1);
      guide.back.hidden = guide.step === 0;
      guide.next.textContent = guide.step === PANEL_COUNT - 1 ? tx.onboardingDone : tx.onboardingNext;
      updateSpotlight();
      if (shouldFocus) {
        const panel = guide.panels[guide.step];
        if (panel) panel.focus();
      }
    }

    function finish() {
      if (!guide) return;
      const oldGuide = guide;
      guide = null;
      if (oldGuide.observer) oldGuide.observer.disconnect();
      if (oldGuide.interval) clearInterval(oldGuide.interval);
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight, true);
      if (oldGuide.host.parentNode) oldGuide.host.parentNode.removeChild(oldGuide.host);
      if (oldGuide.previousFocus && oldGuide.previousFocus.isConnected && oldGuide.previousFocus.focus) {
        try { oldGuide.previousFocus.focus(); } catch (e) {}
      }
      storageSet({ onboardingPending: false });
    }

    function openLauncher() {
      // Keep this click synchronous so the browser can retain the user's gesture.
      const target = document.getElementById(LAUNCHER_ID);
      if (target && typeof target.click === 'function') {
        target.click();
        // Opening the player must not skip the two remaining introduction panels.
        if (guide) {
          guide.step = 1;
          renderStep(true);
        }
      } else {
        updateSpotlight();
      }
    }

    close.addEventListener('click', finish);
    skip.addEventListener('click', finish);
    back.addEventListener('click', function () {
      if (!guide || guide.step <= 0) return;
      guide.step -= 1;
      renderStep(true);
    });
    next.addEventListener('click', function () {
      if (!guide) return;
      if (guide.step >= PANEL_COUNT - 1) {
        finish();
        return;
      }
      guide.step += 1;
      renderStep(true);
    });
    panels[0]._openLauncher.addEventListener('click', openLauncher);
    dialog.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        finish();
        return;
      }
      if (event.key !== 'Tab' || !guide) return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      const activeElement = shadow.activeElement || document.activeElement;
      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    guide.applyLanguage = applyLanguage;
    guide.renderStep = renderStep;
    guide.updateSpotlight = updateSpotlight;
    applyLanguage();
    renderStep(false);
    close.focus();
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, true);
    guide.interval = setInterval(updateSpotlight, 500);
    if (window.MutationObserver && document.body) {
      guide.observer = new MutationObserver(updateSpotlight);
      guide.observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function hideGuide() {
    if (!guide) return;
    const oldGuide = guide;
    guide = null;
    if (oldGuide.observer) oldGuide.observer.disconnect();
    if (oldGuide.interval) clearInterval(oldGuide.interval);
    window.removeEventListener('resize', oldGuide.updateSpotlight);
    window.removeEventListener('scroll', oldGuide.updateSpotlight, true);
    if (oldGuide.host.parentNode) oldGuide.host.parentNode.removeChild(oldGuide.host);
  }

  function init() {
    if (!chrome.storage || !chrome.storage.local) return;
    storageGet(['onboardingPending', 'preferredLanguage'], function (stored) {
      if (stored.onboardingPending) showGuide(stored.preferredLanguage);
    });
    if (chrome.storage.onChanged && chrome.storage.onChanged.addListener) {
      chrome.storage.onChanged.addListener(function (changes, area) {
        if (area !== 'local') return;
        if (changes.onboardingPending && changes.onboardingPending.newValue === false) {
          hideGuide();
        } else if (changes.onboardingPending && changes.onboardingPending.newValue) {
          storageGet(['preferredLanguage'], function (stored) { showGuide(stored.preferredLanguage); });
        }
        if (changes.preferredLanguage && guide && guide.applyLanguage) {
          guide.language = changes.preferredLanguage.newValue || 'auto';
          guide.applyLanguage();
          guide.renderStep(false);
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
