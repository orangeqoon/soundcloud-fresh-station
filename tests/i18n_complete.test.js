const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const baseDir = path.resolve(__dirname, '..');
const i18n = require(path.join(baseDir, 'i18n.js'));

const SUPPORTED_LANGS = ['ja', 'en', 'de', 'ru', 'vi', 'es', 'ro'];

// Intentional English / Universal tokens allowed to match English verbatim across languages
const ALLOWED_IDENTICAL_TO_EN = new Set([
  'appName',             // "FreshDig"
  'discoveryStatusOn',   // "ON"
  'discoveryStatusOff',  // "OFF"
  'onboardingProgress',  // "{n} / 3"
  'statDislike'          // "NoPlay" (feature name token)
]);

test('i18n: all supported languages exist in i18n.translations', () => {
  const defined = Object.keys(i18n.translations);
  for (const lang of SUPPORTED_LANGS) {
    assert.ok(defined.includes(lang), `Missing language in i18n.translations: ${lang}`);
  }
});

test('i18n: all languages have identical key sets with en', () => {
  const enKeys = Object.keys(i18n.translations.en).sort();
  for (const lang of SUPPORTED_LANGS) {
    if (lang === 'en') continue;
    const langKeys = Object.keys(i18n.translations[lang]).sort();
    const missing = enKeys.filter(k => !langKeys.includes(k));
    const extra = langKeys.filter(k => !enKeys.includes(k));
    assert.deepStrictEqual(missing, [], `Language [${lang}] is missing keys: ${missing.join(', ')}`);
    assert.deepStrictEqual(extra, [], `Language [${lang}] has extra keys: ${extra.join(', ')}`);
  }
});

test('i18n: placeholders match across all languages', () => {
  function getPlaceholders(str) {
    if (typeof str !== 'string') return '';
    const m = str.match(/\{[a-zA-Z0-9_]+\}/g);
    return m ? m.sort().join(',') : '';
  }

  const enKeys = Object.keys(i18n.translations.en);
  for (const k of enKeys) {
    const enPh = getPlaceholders(i18n.translations.en[k]);
    for (const lang of SUPPORTED_LANGS) {
      if (lang === 'en') continue;
      const langPh = getPlaceholders(i18n.translations[lang][k]);
      assert.strictEqual(langPh, enPh, `Placeholder mismatch in [${lang}].${k}: expected "${enPh}", got "${langPh}"`);
    }
  }
});

test('i18n: no untranslated fallback English strings without whitelist', () => {
  const en = i18n.translations.en;
  const violations = [];

  for (const lang of SUPPORTED_LANGS) {
    if (lang === 'en') continue;
    const current = i18n.translations[lang];
    for (const key of Object.keys(en)) {
      if (ALLOWED_IDENTICAL_TO_EN.has(key)) continue;
      if (current[key] === en[key] && typeof en[key] === 'string' && en[key].trim().length > 0) {
        // Flag identical strings as untranslated violations
        violations.push(`[${lang}] "${key}": "${current[key]}"`);
      }
    }
  }

  assert.deepStrictEqual(
    violations,
    [],
    `Found ${violations.length} untranslated English strings:\n` + violations.join('\n')
  );
});

test('i18n: lists.html and heard.html load i18n.js before page scripts', () => {
  const listsHtml = fs.readFileSync(path.join(baseDir, 'lists.html'), 'utf8');
  assert.match(listsHtml, /<script[^>]+src=["']i18n\.js["']/, 'lists.html must include i18n.js');

  const heardHtml = fs.readFileSync(path.join(baseDir, 'heard.html'), 'utf8');
  assert.match(heardHtml, /<script[^>]+src=["']i18n\.js["']/, 'heard.html must include i18n.js');
});

test('i18n: popup.js uses FreshDigI18n for shortcutCopy and heardEntryTexts', () => {
  const popupJs = fs.readFileSync(path.join(baseDir, 'popup.js'), 'utf8');
  assert.match(popupJs, /FreshDigI18n\.shortcutCopy/, 'popup.js should use FreshDigI18n.shortcutCopy');
  assert.match(popupJs, /FreshDigI18n\.heardEntryTexts/, 'popup.js should use FreshDigI18n.heardEntryTexts');
});

test('i18n: lists.js and heard.js have complete translations across all 7 languages', () => {
  const vm = require('node:vm');
  function extractTexts(fileName) {
    const content = fs.readFileSync(path.join(baseDir, fileName), 'utf8');
    const start = content.indexOf('const TEXTS = {');
    assert.ok(start !== -1, `const TEXTS not found in ${fileName}`);
    const match = content.slice(start).match(/const TEXTS = \{[\s\S]*?\n\s*\};/);
    assert.ok(match, `Could not match TEXTS block in ${fileName}`);
    const sandbox = {};
    vm.runInNewContext(match[0].replace('const TEXTS = ', 'texts = '), sandbox);
    return sandbox.texts;
  }

  const listsTexts = extractTexts('lists.js');
  const heardTexts = extractTexts('heard.js');

  for (const [name, dict] of [['lists.js', listsTexts], ['heard.js', heardTexts]]) {
    const enKeys = Object.keys(dict.en || dict.ja).sort();
    for (const lang of SUPPORTED_LANGS) {
      assert.ok(dict[lang], `[${name}] Missing language: ${lang}`);
      const langKeys = Object.keys(dict[lang]).sort();
      const missing = enKeys.filter(k => !langKeys.includes(k));
      assert.deepStrictEqual(missing, [], `[${name}] [${lang}] is missing keys: ${missing.join(', ')}`);
    }
  }
});

