(function () {
  'use strict';
  function render(language) {
    const code = FreshDigI18n.resolveLanguage(language);
    const text = FreshDigI18n.getTexts(code);
    document.documentElement.lang = code;
    document.title = text.onboardingTitle;
    document.getElementById('guide-title').textContent = text.onboardingTitle;
    for (let step = 1; step <= 3; step++) {
      document.getElementById('guide-step-' + step).textContent = step + '. ' + text['onboardingStep' + step + 'Title'];
      document.getElementById('guide-body-' + step).textContent = text['onboardingStep' + step + 'Body'];
    }
    document.querySelectorAll('[data-lang]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.lang === code));
    });
  }
  render('auto');
  // The guide always renders, including when a SoundCloud tab has no content script yet.
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['preferredLanguage'], function (stored) {
      if (!chrome.runtime.lastError) render(stored && stored.preferredLanguage || 'auto');
    });
  }
  document.querySelectorAll('[data-lang]').forEach(function (button) {
    button.addEventListener('click', function () { render(button.dataset.lang); });
  });
})();
