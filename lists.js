(function () {
    'use strict';

    const TEXTS = {
        en: {
            pageTitle: 'FreshDig lists', language: 'Language',
            exportTitle: 'Export your lists', exportDescription: 'Save a JSON backup for restoring later, or a Markdown copy for reading.',
            exportJson: 'Download JSON backup', exportMarkdown: 'Download Markdown',
            importTitle: 'Import a JSON backup', importDescription: 'Choose a FreshDig JSON backup, review the additions, then apply them.',
            fileNote: 'JSON only, up to 5 MiB', previewTitle: 'Preview', apply: 'Apply import', retryLater: 'Retry Later artists',
            loading: 'Reading the current SoundCloud lists…', connected: 'Ready to export or import.',
            noTab: 'Open an exact https://soundcloud.com/ tab before continuing.',
            noStorage: 'Could not read local list storage. Your data was left unchanged.',
            noFile: 'Choose a JSON backup file first.', tooLarge: 'The JSON file is larger than 5 MiB.',
            invalidFile: 'This is not a valid FreshDig lists JSON backup.',
            exportError: 'Could not read the current lists, so no file was created.',
            exportedJson: 'JSON backup downloaded.', exportedMarkdown: 'Markdown downloaded.',
            previewReady: 'Review the preview before applying the import.',
            applyError: 'Import completion could not be confirmed. Check your lists and retry if needed.',
            exclusionsFailed: 'The exclusion lists could not be applied. Your current data was left unchanged.',
            partial: 'Partial import: exclusion lists were confirmed, but the Later artists result could not be confirmed. Retry Later artists; duplicate entries are ignored.',
            imported: 'Import complete.', laterRetryDone: 'Later artists were saved. Import complete.',
            retryFailed: 'The Later artists result could not be confirmed. Retry is still available; duplicate entries are ignored.',
            current: 'Current', backup: 'Backup', after: 'After merge', added: 'Added',
            laterArtists: 'Later artists', dislikedTracks: 'NoPlay tracks', dislikedArtists: 'Excluded artists', dislikedGenres: 'Excluded genres',
            counts: 'Counts'
        },
        ja: {
            pageTitle: 'FreshDig リスト', language: '言語',
            exportTitle: 'リストを書き出す', exportDescription: '復元用の JSON バックアップ、または閲覧用の Markdown を保存します。',
            exportJson: 'JSON バックアップを保存', exportMarkdown: 'Markdown を保存',
            importTitle: 'JSON バックアップを読み込む', importDescription: 'FreshDig の JSON を選び、追加内容を確認してから適用します。',
            fileNote: 'JSON のみ、最大 5 MiB', previewTitle: '適用前の確認', apply: '読み込みを適用', retryLater: '後で聴く作者を再試行',
            loading: 'SoundCloud の現在のリストを読み込んでいます…', connected: '書き出しまたは読み込みの準備ができました。',
            noTab: '正確な https://soundcloud.com/ のタブを開いてから続行してください。',
            noStorage: 'ローカルのリストを読み込めませんでした。データは変更していません。',
            noFile: '先に JSON バックアップを選択してください。', tooLarge: 'JSON ファイルが 5 MiB を超えています。',
            invalidFile: 'FreshDig リストの JSON バックアップではありません。',
            exportError: '現在のリストを読み込めないため、ファイルを作成しませんでした。',
            exportedJson: 'JSON バックアップを保存しました。', exportedMarkdown: 'Markdown を保存しました。',
            previewReady: '内容を確認してから適用してください。',
            applyError: '読み込みの完了を確認できませんでした。リストを確認し、必要なら再試行してください。',
            exclusionsFailed: '除外リストを適用できませんでした。現在のデータは変更していません。',
            partial: '一部適用: 除外リストは確認できましたが、後で聴く作者の結果を確認できませんでした。重複項目は無視されるため再試行できます。',
            imported: '読み込みが完了しました。', laterRetryDone: '後で聴く作者を保存しました。読み込みが完了しました。',
            retryFailed: '後で聴く作者の結果を確認できませんでした。重複項目は無視されるため再試行は安全です。',
            current: '現在', backup: 'バックアップ', after: '統合後', added: '追加',
            laterArtists: '後で聴く作者', dislikedTracks: 'NoPlay 曲', dislikedArtists: '除外作者', dislikedGenres: '除外ジャンル',
            counts: '件数'
        },
        de: {
            pageTitle: 'FreshDig-Listen', language: 'Sprache',
            exportTitle: 'Listen exportieren', exportDescription: 'JSON zur späteren Wiederherstellung oder Markdown zum Lesen speichern.',
            exportJson: 'JSON-Backup herunterladen', exportMarkdown: 'Markdown herunterladen',
            importTitle: 'JSON-Backup importieren', importDescription: 'Ein FreshDig-Backup wählen, Ergänzungen prüfen und anwenden.',
            fileNote: 'Nur JSON, bis 5 MiB', previewTitle: 'Vorschau', apply: 'Import anwenden', retryLater: 'Später-Künstler erneut versuchen',
            loading: 'Aktuelle SoundCloud-Listen werden gelesen…', connected: 'Bereit zum Export oder Import.',
            noTab: 'Öffne zuerst einen exakten https://soundcloud.com/-Tab.',
            noStorage: 'Lokale Listen konnten nicht gelesen werden. Deine Daten bleiben unverändert.',
            noFile: 'Wähle zuerst eine JSON-Datei.', tooLarge: 'Die JSON-Datei ist größer als 5 MiB.',
            invalidFile: 'Dies ist kein gültiges FreshDig-Listen-Backup.',
            exportError: 'Aktuelle Listen konnten nicht gelesen werden; es wurde keine Datei erstellt.',
            exportedJson: 'JSON-Backup heruntergeladen.', exportedMarkdown: 'Markdown heruntergeladen.',
            previewReady: 'Prüfe die Vorschau vor dem Anwenden.',
            applyError: 'Der Abschluss des Imports konnte nicht bestätigt werden. Prüfe deine Listen und versuche es bei Bedarf erneut.',
            exclusionsFailed: 'Ausschlusslisten konnten nicht angewendet werden. Deine Daten bleiben unverändert.',
            partial: 'Teilimport: Ausschlusslisten wurden bestätigt, aber das Ergebnis der Später-Künstler konnte nicht bestätigt werden. Erneut versuchen; Duplikate werden ignoriert.',
            imported: 'Import abgeschlossen.', laterRetryDone: 'Später-Künstler gespeichert. Import abgeschlossen.',
            retryFailed: 'Das Ergebnis der Später-Künstler konnte nicht bestätigt werden. Erneuter Versuch bleibt möglich; Duplikate werden ignoriert.',
            current: 'Aktuell', backup: 'Backup', after: 'Nach Zusammenführung', added: 'Neu',
            laterArtists: 'Später-Künstler', dislikedTracks: 'NoPlay-Titel', dislikedArtists: 'Ausgeschlossene Künstler', dislikedGenres: 'Ausgeschlossene Genres',
            counts: 'Anzahl'
        },
        ru: {
            pageTitle: 'Списки FreshDig', language: 'Язык',
            exportTitle: 'Экспорт списков', exportDescription: 'Сохраните JSON для восстановления или Markdown для просмотра.',
            exportJson: 'Скачать JSON-копию', exportMarkdown: 'Скачать Markdown',
            importTitle: 'Импорт JSON-копии', importDescription: 'Выберите копию FreshDig, проверьте добавления и примените их.',
            fileNote: 'Только JSON, до 5 МиБ', previewTitle: 'Предпросмотр', apply: 'Применить импорт', retryLater: 'Повторить авторов «Позже»',
            loading: 'Читаем текущие списки SoundCloud…', connected: 'Готово к экспорту или импорту.',
            noTab: 'Сначала откройте точную вкладку https://soundcloud.com/.',
            noStorage: 'Не удалось прочитать локальные списки. Данные не изменены.',
            noFile: 'Сначала выберите JSON-копию.', tooLarge: 'Размер JSON-файла превышает 5 МиБ.',
            invalidFile: 'Это недействительная JSON-копия списков FreshDig.',
            exportError: 'Не удалось прочитать текущие списки, файл не создан.',
            exportedJson: 'JSON-копия скачана.', exportedMarkdown: 'Markdown скачан.',
            previewReady: 'Проверьте предпросмотр перед применением.',
            applyError: 'Не удалось подтвердить завершение импорта. Проверьте списки и при необходимости повторите попытку.',
            exclusionsFailed: 'Не удалось применить списки исключений. Данные не изменены.',
            partial: 'Частичный импорт: применение списков исключений подтверждено, но результат для авторов «Позже» подтвердить не удалось. Повторите попытку; дубликаты игнорируются.',
            imported: 'Импорт завершён.', laterRetryDone: 'Авторы «Позже» сохранены. Импорт завершён.',
            retryFailed: 'Результат для авторов «Позже» подтвердить не удалось. Повтор всё ещё доступен; дубликаты игнорируются.',
            current: 'Сейчас', backup: 'Копия', after: 'После слияния', added: 'Добавлено',
            laterArtists: 'Авторы «Позже»', dislikedTracks: 'Треки NoPlay', dislikedArtists: 'Исключённые авторы', dislikedGenres: 'Исключённые жанры',
            counts: 'Количество'
        },
        vi: {
            pageTitle:'Danh sách FreshDig',language:'Ngôn ngữ',exportTitle:'Xuất danh sách',exportDescription:'Lưu bản sao JSON để khôi phục hoặc bản Markdown để xem.',exportJson:'Tải bản sao JSON',exportMarkdown:'Tải Markdown',importTitle:'Nhập bản sao JSON',importDescription:'Chọn bản sao FreshDig, xem các mục thêm rồi áp dụng.',fileNote:'Chỉ JSON, tối đa 5 MiB',previewTitle:'Xem trước',apply:'Áp dụng nhập',retryLater:'Thử lại nghệ sĩ nghe sau',loading:'Đang đọc danh sách SoundCloud…',connected:'Sẵn sàng xuất hoặc nhập.',noTab:'Mở tab https://soundcloud.com/ chính xác trước khi tiếp tục.',noStorage:'Không đọc được danh sách cục bộ. Dữ liệu không đổi.',noFile:'Hãy chọn tệp JSON trước.',tooLarge:'Tệp JSON lớn hơn 5 MiB.',invalidFile:'Đây không phải bản sao danh sách FreshDig hợp lệ.',exportError:'Không đọc được danh sách hiện tại nên không tạo tệp.',exportedJson:'Đã tải bản sao JSON.',exportedMarkdown:'Đã tải Markdown.',previewReady:'Xem trước trước khi áp dụng.',applyError:'Không xác nhận được hoàn tất nhập. Hãy kiểm tra danh sách và thử lại nếu cần.',exclusionsFailed:'Không thể áp dụng danh sách loại trừ. Dữ liệu hiện tại không đổi.',partial:'Nhập một phần: danh sách loại trừ đã xác nhận nhưng chưa xác nhận được nghệ sĩ nghe sau. Có thể thử lại; mục trùng bị bỏ qua.',imported:'Đã nhập xong.',laterRetryDone:'Đã lưu nghệ sĩ nghe sau. Nhập xong.',retryFailed:'Chưa xác nhận được nghệ sĩ nghe sau. Vẫn có thể thử lại; mục trùng bị bỏ qua.',current:'Hiện tại',backup:'Bản sao',after:'Sau khi gộp',added:'Đã thêm',laterArtists:'Nghệ sĩ nghe sau',dislikedTracks:'Bài NoPlay',dislikedArtists:'Nghệ sĩ loại trừ',dislikedGenres:'Thể loại loại trừ',counts:'Số lượng'
        },
        es: {
            pageTitle:'Listas de FreshDig',language:'Idioma',exportTitle:'Exportar listas',exportDescription:'Guarda una copia JSON para restaurar o una copia Markdown para leer.',exportJson:'Descargar copia JSON',exportMarkdown:'Descargar Markdown',importTitle:'Importar copia JSON',importDescription:'Elige una copia de FreshDig, revisa las adiciones y aplícalas.',fileNote:'Solo JSON, hasta 5 MiB',previewTitle:'Vista previa',apply:'Aplicar importación',retryLater:'Reintentar artistas para después',loading:'Leyendo las listas actuales de SoundCloud…',connected:'Listo para exportar o importar.',noTab:'Abre una pestaña exacta de https://soundcloud.com/ antes de continuar.',noStorage:'No se pudieron leer las listas locales. Tus datos no cambiaron.',noFile:'Elige primero un archivo JSON.',tooLarge:'El archivo JSON supera 5 MiB.',invalidFile:'No es una copia válida de listas de FreshDig.',exportError:'No se pudieron leer las listas actuales; no se creó ningún archivo.',exportedJson:'Copia JSON descargada.',exportedMarkdown:'Markdown descargado.',previewReady:'Revisa la vista previa antes de aplicar.',applyError:'No se pudo confirmar la importación. Comprueba las listas y reintenta si hace falta.',exclusionsFailed:'No se pudieron aplicar las listas de exclusión. Tus datos no cambiaron.',partial:'Importación parcial: se confirmaron las exclusiones, pero no los artistas para después. Puedes reintentar; los duplicados se ignoran.',imported:'Importación completada.',laterRetryDone:'Artistas para después guardados. Importación completada.',retryFailed:'No se pudo confirmar el resultado de los artistas para después. Puedes reintentar; los duplicados se ignoran.',current:'Actual',backup:'Copia',after:'Después de combinar',added:'Añadido',laterArtists:'Artistas para después',dislikedTracks:'Pistas NoPlay',dislikedArtists:'Artistas excluidos',dislikedGenres:'Géneros excluidos',counts:'Cantidad'
        }
    };

    const LIST_ROWS = [
        ['laterArtists', 'laterArtists'],
        ['dislikedTracks', 'dislikedTracks'],
        ['dislikedArtists', 'dislikedArtists'],
        ['dislikedGenres', 'dislikedGenres']
    ];

    let language = 'en';
    let pending = null;
    let partialPending = null;
    let currentLists = null;
    let importGeneration = 0;
    let importPreparing = false;
    let importApplying = false;

    function byId(id) { return document.getElementById(id); }

    function text(key) {
        return (TEXTS[language] && TEXTS[language][key]) || TEXTS.en[key] || key;
    }

    function setText(id, key) {
        const element = byId(id);
        if (element) element.textContent = text(key);
    }

    function setStatus(message, kind) {
        const element = byId('status');
        if (!element) return;
        element.className = 'status' + (kind ? ' ' + kind : '');
        element.textContent = message || '';
    }

    function isRuntimeError() {
        return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError;
    }

    function invokeChrome(method, receiver, args) {
        return new Promise(function (resolve, reject) {
            let settled = false;
            function finish(value, error) {
                if (settled) return;
                settled = true;
                if (error) reject(error);
                else resolve(value);
            }
            function callback(value) {
                const runtimeError = isRuntimeError();
                if (runtimeError) {
                    finish(null, new Error(runtimeError.message || 'Chrome API error'));
                    return;
                }
                finish(value, null);
            }
            try {
                const result = method.apply(receiver, (args || []).concat(callback));
                if (result && typeof result.then === 'function') {
                    result.then(function (value) { finish(value, null); }, function (error) { finish(null, error); });
                } else if (result !== undefined) {
                    finish(result, null);
                }
            } catch (error) {
                finish(null, error);
            }
        });
    }

    function storageGet(key) {
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local ||
            typeof chrome.storage.local.get !== 'function') {
            return Promise.reject(new Error('storage unavailable'));
        }
        return invokeChrome(chrome.storage.local.get, chrome.storage.local, [key]);
    }

    function tabsQuery(query) {
        if (typeof chrome === 'undefined' || !chrome.tabs || typeof chrome.tabs.query !== 'function') {
            return Promise.reject(new Error('tabs unavailable'));
        }
        return invokeChrome(chrome.tabs.query, chrome.tabs, [query]);
    }

    function sendTabMessage(tabId, message) {
        if (typeof chrome === 'undefined' || !chrome.tabs || typeof chrome.tabs.sendMessage !== 'function') {
            return Promise.reject(new Error('tabs unavailable'));
        }
        return invokeChrome(chrome.tabs.sendMessage, chrome.tabs, [tabId, message]);
    }

    function sendRuntimeMessage(message) {
        if (typeof chrome === 'undefined' || !chrome.runtime || typeof chrome.runtime.sendMessage !== 'function') {
            return Promise.reject(new Error('runtime unavailable'));
        }
        return invokeChrome(chrome.runtime.sendMessage, chrome.runtime, [message]);
    }

    function isExactSoundCloudTab(tab) {
        if (!tab || tab.id === undefined || tab.id === null || typeof tab.url !== 'string') return false;
        try {
            const url = new URL(tab.url);
            return url.protocol === 'https:' && url.hostname.toLowerCase() === 'soundcloud.com' &&
                url.pathname.charAt(0) === '/';
        } catch (e) {
            return false;
        }
    }

    async function findSoundCloudTab() {
        const active = await tabsQuery({ active: true, currentWindow: true, url: 'https://soundcloud.com/*' });
        if (Array.isArray(active)) {
            const activeMatch = active.find(isExactSoundCloudTab);
            if (activeMatch) return activeMatch;
        }
        const all = await tabsQuery({ url: 'https://soundcloud.com/*' });
        if (Array.isArray(all)) return all.find(isExactSoundCloudTab) || null;
        return null;
    }

    function normalizeStorageLater(value) {
        return value && Array.isArray(value.laterArtists) ? value.laterArtists : [];
    }

    async function readCurrentLists(tab) {
        if (!tab || !isExactSoundCloudTab(tab)) throw new Error('no soundcloud tab');
        let response;
        try {
            response = await sendTabMessage(tab.id, { target: 'SC_FRESH_STATION', action: 'GET_LISTS' });
        } catch (error) {
            throw new Error('tab unavailable');
        }
        if (!response || response.success !== true || !response.lists) throw new Error('list response unavailable');
        let stored;
        try {
            stored = await storageGet('laterArtists');
        } catch (error) {
            throw new Error('storage unavailable');
        }
        try {
            return FreshDigLists.create({
                laterArtists: normalizeStorageLater(stored),
                dislikedTracks: response.lists.dislikedTracks,
                dislikedArtists: response.lists.dislikedArtists,
                dislikedGenres: response.lists.dislikedGenres
            }).lists;
        } catch (error) {
            throw new Error('stored lists are invalid');
        }
    }

    function byteLength(value) {
        if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value).length;
        if (typeof Blob !== 'undefined') return new Blob([value]).size;
        return unescape(encodeURIComponent(value)).length;
    }

    function serializeJsonBackup(envelope) {
        // The validator measures compact JSON; pretty printing can make a valid backup exceed 5 MiB.
        const serialized = JSON.stringify(envelope);
        if (byteLength(serialized) > FreshDigLists.MAX_JSON_BYTES) throw new Error('too large');
        return serialized;
    }

    function readFileText(file) {
        if (!file) return Promise.reject(new Error('no file'));
        if (typeof file.size === 'number' && file.size > FreshDigLists.MAX_JSON_BYTES) {
            return Promise.reject(new Error('too large'));
        }
        if (typeof file.text === 'function') {
            return Promise.resolve(file.text()).then(function (value) {
                if (byteLength(value) > FreshDigLists.MAX_JSON_BYTES) throw new Error('too large');
                return value;
            });
        }
        if (typeof FileReader === 'undefined') return Promise.reject(new Error('file reader unavailable'));
        return new Promise(function (resolve, reject) {
            const reader = new FileReader();
            reader.onerror = function () { reject(new Error('file read failed')); };
            reader.onload = function () {
                const value = String(reader.result || '');
                if (byteLength(value) > FreshDigLists.MAX_JSON_BYTES) reject(new Error('too large'));
                else resolve(value);
            };
            reader.readAsText(file);
        });
    }

    function timestamp() {
        const now = new Date();
        function pad(value) { return String(value).padStart(2, '0'); }
        return now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' +
            pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
    }

    function downloadText(filename, content, mime) {
        if (typeof Blob === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
            throw new Error('download unavailable');
        }
        const blob = new Blob([content], { type: mime + ';charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.rel = 'noopener';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    async function exportLists(kind) {
        const button = kind === 'json' ? byId('export-json') : byId('export-markdown');
        if (button) button.disabled = true;
        setStatus(text('loading'), '');
        try {
            const tab = await findSoundCloudTab();
            if (!tab) throw new Error('no soundcloud tab');
            const lists = await readCurrentLists(tab);
            currentLists = lists;
            const envelope = FreshDigLists.create(lists);
            if (kind === 'json') {
                downloadText('freshdig-lists-' + timestamp() + '.json', serializeJsonBackup(envelope), 'application/json');
                setStatus(text('exportedJson'), 'ok');
            } else {
                downloadText('freshdig-lists-' + timestamp() + '.md', FreshDigLists.toMarkdown(envelope), 'text/markdown');
                setStatus(text('exportedMarkdown'), 'ok');
            }
        } catch (error) {
            setStatus(error && error.message === 'no soundcloud tab' ? text('noTab') : text('exportError'), 'error');
        } finally {
            if (button) button.disabled = false;
        }
    }

    function countValue(counts, key) { return counts && Number.isFinite(counts[key]) ? counts[key] : 0; }

    function partialStatus(pendingImport) {
        const counts = FreshDigLists.counts(pendingImport.envelope.lists);
        return text('partial') + ' [' + text('laterArtists') + ': ' + countValue(counts, 'laterArtists') +
            ', ' + text('dislikedTracks') + ': ' + countValue(counts, 'dislikedTracks') +
            ', ' + text('dislikedArtists') + ': ' + countValue(counts, 'dislikedArtists') +
            ', ' + text('dislikedGenres') + ': ' + countValue(counts, 'dislikedGenres') + ']';
    }

    function renderPreview(source, incoming, merged) {
        const preview = byId('preview');
        const grid = byId('preview-grid');
        if (!preview || !grid) return;
        grid.textContent = '';
        const currentCounts = FreshDigLists.counts(source);
        const incomingCounts = FreshDigLists.counts(incoming);
        const mergedCounts = FreshDigLists.counts(merged);
        const headers = [text('counts'), text('current'), text('backup'), text('after'), text('added')];
        headers.forEach(function (value, index) {
            const cell = document.createElement('span');
            cell.className = 'head';
            cell.textContent = value;
            if (index === 0) cell.className += ' name';
            grid.appendChild(cell);
        });
        LIST_ROWS.forEach(function (row) {
            const name = document.createElement('span');
            name.className = 'name';
            name.textContent = text(row[1]);
            grid.appendChild(name);
            [currentCounts, incomingCounts, mergedCounts].forEach(function (counts) {
                const cell = document.createElement('span');
                cell.textContent = String(countValue(counts, row[0]));
                grid.appendChild(cell);
            });
            const added = document.createElement('span');
            added.textContent = String(Math.max(0, countValue(mergedCounts, row[0]) - countValue(currentCounts, row[0])));
            grid.appendChild(added);
        });
        preview.hidden = false;
        syncImportControls();
    }

    function syncImportControls() {
        const file = byId('backup-file');
        const apply = byId('apply-import');
        const button = byId('retry-later');
        if (file) file.disabled = importApplying;
        if (apply) apply.disabled = importApplying || importPreparing || !pending;
        if (button) {
            button.classList.toggle('hidden', !partialPending);
            button.disabled = importApplying || importPreparing || !partialPending;
        }
    }

    function isCurrentGeneration(generation) {
        return generation === importGeneration;
    }

    function isCurrentSnapshot(snapshot, generation) {
        return isCurrentGeneration(generation) && pending === snapshot;
    }

    async function prepareImport(file) {
        // A newer file selection owns the page state; older reads may finish later.
        if (importApplying) return;
        const generation = ++importGeneration;
        importPreparing = true;
        pending = null;
        const preview = byId('preview');
        if (preview) preview.hidden = !partialPending;
        syncImportControls();
        if (!file) {
            importPreparing = false;
            syncImportControls();
            setStatus(text('noFile'), 'error');
            return;
        }
        setStatus(text('loading'), '');
        try {
            const raw = await readFileText(file);
            if (!isCurrentGeneration(generation)) return;
            let parsed;
            try {
                parsed = JSON.parse(raw);
            } catch (error) {
                throw new Error('invalid file');
            }
            const envelope = FreshDigLists.normalize(parsed);
            if (!isCurrentGeneration(generation)) return;
            const tab = await findSoundCloudTab();
            if (!isCurrentGeneration(generation)) return;
            if (!tab) throw new Error('no soundcloud tab');
            const source = await readCurrentLists(tab);
            if (!isCurrentGeneration(generation)) return;
            const merged = FreshDigLists.merge(source, envelope.lists);
            if (!isCurrentGeneration(generation)) return;
            currentLists = source;
            pending = { tab: tab, envelope: envelope, source: source, merged: merged };
            importPreparing = false;
            renderPreview(source, envelope.lists, merged);
            syncImportControls();
            setStatus(text('previewReady'), 'ok');
        } catch (error) {
            if (!isCurrentGeneration(generation)) return;
            importPreparing = false;
            syncImportControls();
            const message = error && error.message;
            if (message === 'too large') setStatus(text('tooLarge'), 'error');
            else if (message === 'no soundcloud tab') setStatus(text('noTab'), 'error');
            else if (message === 'storage unavailable') setStatus(text('noStorage'), 'error');
            else if (message === 'tab unavailable' || message === 'list response unavailable' || message === 'stored lists are invalid') {
                setStatus(text('noStorage'), 'error');
            } else setStatus(text('invalidFile'), 'error');
        }
    }

    async function applyImport() {
        if (importApplying || importPreparing) return;
        const importSnapshot = pending;
        if (!importSnapshot) {
            setStatus(text('noFile'), 'error');
            return;
        }
        // Keep using this object after every await, even if a synthetic change event fires.
        const generation = importGeneration;
        importApplying = true;
        syncImportControls();
        setStatus(text('loading'), '');
        try {
            const tab = await findSoundCloudTab();
            if (!tab) throw new Error('no soundcloud tab');
            if (!isCurrentSnapshot(importSnapshot, generation)) return;
            const response = await sendTabMessage(tab.id, {
                target: 'SC_FRESH_STATION',
                action: 'IMPORT_EXCLUSIONS',
                lists: importSnapshot.envelope.lists
            });
            if (!isCurrentSnapshot(importSnapshot, generation)) {
                partialPending = importSnapshot;
                if (pending === importSnapshot) pending = null;
                setStatus(partialStatus(importSnapshot), 'partial');
                return;
            }
            if (!response || response.success !== true) throw new Error('exclusions failed');
            importSnapshot.tab = tab;
            try {
                const laterResponse = await sendRuntimeMessage({ action: 'LATER_IMPORT', items: importSnapshot.envelope.lists.laterArtists });
                if (!laterResponse || laterResponse.ok !== true) throw new Error('later failed');
                if (!isCurrentSnapshot(importSnapshot, generation)) return;
                if (pending === importSnapshot) pending = null;
                if (partialPending === importSnapshot) partialPending = null;
                setStatus(text('imported'), 'ok');
            } catch (error) {
                if (pending === importSnapshot) pending = null;
                partialPending = importSnapshot;
                setStatus(partialStatus(importSnapshot), 'partial');
            }
        } catch (error) {
            if (error && error.message === 'no soundcloud tab') setStatus(text('noTab'), 'error');
            else if (error && error.message === 'exclusions failed') setStatus(text('exclusionsFailed'), 'error');
            else setStatus(text('applyError'), 'error');
        } finally {
            importApplying = false;
            syncImportControls();
        }
    }

    async function retryLater() {
        if (importApplying || importPreparing) return;
        const importSnapshot = partialPending;
        if (!importSnapshot) return;
        const generation = importGeneration;
        importApplying = true;
        syncImportControls();
        setStatus(text('loading'), '');
        try {
            const tab = await findSoundCloudTab();
            if (!tab) throw new Error('no soundcloud tab');
            if (!isCurrentGeneration(generation) || partialPending !== importSnapshot) return;
            const response = await sendRuntimeMessage({ action: 'LATER_IMPORT', items: importSnapshot.envelope.lists.laterArtists });
            if (!response || response.ok !== true) throw new Error('later failed');
            if (!isCurrentGeneration(generation) || partialPending !== importSnapshot) return;
            if (pending === importSnapshot) pending = null;
            partialPending = null;
            setStatus(text('laterRetryDone'), 'ok');
        } catch (error) {
            setStatus(error && error.message === 'no soundcloud tab' ? text('noTab') :
                partialStatus(importSnapshot) + ' ' + text('retryFailed'), 'partial');
        } finally {
            importApplying = false;
            syncImportControls();
        }
    }

    function applyLanguage() {
        document.documentElement.lang = language;
        document.title = text('pageTitle');
        setText('page-title', 'pageTitle');
        setText('language-label', 'language');
        setText('export-title', 'exportTitle');
        setText('export-description', 'exportDescription');
        setText('export-json', 'exportJson');
        setText('export-markdown', 'exportMarkdown');
        setText('import-title', 'importTitle');
        setText('import-description', 'importDescription');
        setText('file-note', 'fileNote');
        setText('preview-title', 'previewTitle');
        setText('apply-import', 'apply');
        setText('retry-later', 'retryLater');
        const select = byId('language-select');
        if (select) select.value = language;
    }

    async function loadLanguage() {
        try {
            const stored = await storageGet('preferredLanguage');
            const preferred = stored && stored.preferredLanguage;
            if (preferred && preferred !== 'auto' && TEXTS[preferred]) language = preferred;
            else if (preferred === 'auto' || !preferred) {
                const browserLanguage = typeof navigator !== 'undefined' ? String(navigator.language || '').slice(0, 2).toLowerCase() : '';
                if (TEXTS[browserLanguage]) language = browserLanguage;
            }
        } catch (error) {
            // The page remains usable when extension storage is unavailable.
        }
        applyLanguage();
    }

    function bind() {
        const exportJson = byId('export-json');
        const exportMarkdown = byId('export-markdown');
        const file = byId('backup-file');
        const apply = byId('apply-import');
        const retry = byId('retry-later');
        const languageSelect = byId('language-select');
        if (exportJson) exportJson.addEventListener('click', function () { exportLists('json'); });
        if (exportMarkdown) exportMarkdown.addEventListener('click', function () { exportLists('markdown'); });
        if (file) file.addEventListener('change', function () { prepareImport(file.files && file.files[0]); });
        if (apply) apply.addEventListener('click', applyImport);
        if (retry) retry.addEventListener('click', retryLater);
        if (languageSelect) languageSelect.addEventListener('change', function () {
            if (TEXTS[languageSelect.value]) language = languageSelect.value;
            applyLanguage();
            if (pending) renderPreview(pending.source, pending.envelope.lists, pending.merged);
        });
        syncImportControls();
    }

    function focusMode() {
        try {
            const params = new URLSearchParams(window.location.search || '');
            const mode = params.get('mode');
            if (mode === 'import') byId('backup-file')?.focus();
            if (mode === 'export') byId('export-json')?.focus();
        } catch (error) {}
    }

    document.addEventListener('DOMContentLoaded', function () {
        bind();
        loadLanguage().finally(function () {
            focusMode();
            setStatus(text('connected'), '');
        });
    });
}());
