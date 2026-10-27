(function () {
    'use strict';

    const PAGE_SIZE = 500;
    const FILE_RECORD_LIMIT = 5000;
    const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
    const BACKUP_SCHEMA = 'soundcloud-fresh-station/heard-history';
    let requestSeq = 0;

    const TEXTS = {
        ja: {
            title: '🎧 既聴曲の履歴', subtitle: '実際に聴いた曲をFreshDigがローカルに保存します。', languageLabel: '言語',
            statsTitle: 'ローカル履歴', countLabel: '曲数', oldestLabel: '最古', newestLabel: '最新',
            localOnly: 'ローカルのみ：この履歴は拡張機能内に保存され、SoundCloudやクラウドサービスへ送信されません。',
            backupTitle: '手動バックアップ', backupDescription: '上限付きのJSONファイルへ書き出し、バックアップファイルから曲を追加できます。',
            exportButton: '📤 JSONバックアップを書き出す', importLabel: 'JSONバックアップを読み込む（各ファイル5MiBまで）',
            importHint: '読み込みは追加のみです。既存の曲IDは変更されません。', deleteTitle: 'ローカル履歴を削除',
            deleteDescription: 'この拡張機能に保存された既聴曲をすべて削除します。', deleteButton: '🗑 履歴をすべて削除',
            confirmDelete: '既聴曲の履歴をすべて削除しますか？この操作は元に戻せません。',
            loading: '読み込み中…', ready: '準備完了。', unavailable: '既聴曲ストレージを利用できません。',
            exportProgress: '{done}曲を書き出し中…', exportDone: '{count}曲を{parts}個のJSONファイルに保存しました。',
            importProgress: '{file}を読み込み中…', importDone: '{added}曲を追加しました（既存・重複{skipped}曲）。',
            invalidFile: 'バックアップ形式が正しくないか、ファイルが大きすぎます。', operationFailed: '操作に失敗しました。',
            deleteDone: '既聴曲の履歴を削除しました。', noRecords: '既聴曲はありません。'
        },
        en: {
            title: '🎧 Heard-track history', subtitle: 'FreshDig keeps tracks you actually heard in local extension storage.', languageLabel: 'Language',
            statsTitle: 'Local history', countLabel: 'Tracks', oldestLabel: 'Oldest', newestLabel: 'Newest',
            localOnly: 'Local only: this history stays in the extension and is never sent to SoundCloud or a cloud service.',
            backupTitle: 'Manual backup', backupDescription: 'Export bounded JSON files, or add records from one or more backup files.',
            exportButton: '📤 Export JSON backup', importLabel: 'Import JSON backup files (up to 5 MiB each)',
            importHint: 'Import is additive: existing track IDs are kept unchanged.', deleteTitle: 'Delete local history',
            deleteDescription: 'Remove every heard-track record from this extension.', deleteButton: '🗑 Delete all history',
            confirmDelete: 'Delete all heard-track history? This cannot be undone.', loading: 'Loading…', ready: 'Ready.',
            unavailable: 'Heard-track storage is unavailable.', exportProgress: 'Exporting {done} tracks…',
            exportDone: 'Saved {count} tracks in {parts} JSON files.', importProgress: 'Importing {file}…',
            importDone: 'Added {added} tracks ({skipped} existing or duplicate).', invalidFile: 'The backup format is invalid or the file is too large.',
            operationFailed: 'The operation failed.', deleteDone: 'Heard-track history deleted.', noRecords: 'No heard tracks.'
        },
        de: {
            title: '🎧 Verlauf gehörter Titel', subtitle: 'FreshDig speichert tatsächlich gehörte Titel lokal in der Erweiterung.', languageLabel: 'Sprache',
            statsTitle: 'Lokaler Verlauf', countLabel: 'Titel', oldestLabel: 'Ältester', newestLabel: 'Neuester',
            localOnly: 'Nur lokal: Dieser Verlauf bleibt in der Erweiterung und wird nie an SoundCloud oder einen Cloud-Dienst gesendet.',
            backupTitle: 'Manuelles Backup', backupDescription: 'Begrenzte JSON-Dateien exportieren oder Titel aus Backup-Dateien hinzufügen.',
            exportButton: '📤 JSON-Backup exportieren', importLabel: 'JSON-Backups importieren (je Datei bis 5 MiB)',
            importHint: 'Der Import fügt nur hinzu: Vorhandene Titel-IDs bleiben unverändert.', deleteTitle: 'Lokalen Verlauf löschen',
            deleteDescription: 'Alle gehörten Titel aus dieser Erweiterung entfernen.', deleteButton: '🗑 Gesamten Verlauf löschen',
            confirmDelete: 'Den gesamten Verlauf gehörter Titel löschen? Dies kann nicht rückgängig gemacht werden.', loading: 'Wird geladen…', ready: 'Bereit.',
            unavailable: 'Speicher für gehörte Titel ist nicht verfügbar.', exportProgress: '{done} Titel werden exportiert…',
            exportDone: '{count} Titel in {parts} JSON-Dateien gespeichert.', importProgress: '{file} wird importiert…',
            importDone: '{added} Titel hinzugefügt ({skipped} vorhanden oder doppelt).', invalidFile: 'Backup-Format ungültig oder Datei zu groß.',
            operationFailed: 'Der Vorgang ist fehlgeschlagen.', deleteDone: 'Verlauf gehörter Titel gelöscht.', noRecords: 'Keine gehörten Titel.'
        },
        ru: {
            title: '🎧 История прослушанных треков', subtitle: 'FreshDig хранит действительно прослушанные треки локально в расширении.', languageLabel: 'Язык',
            statsTitle: 'Локальная история', countLabel: 'Треки', oldestLabel: 'Самый старый', newestLabel: 'Самый новый',
            localOnly: 'Только локально: история хранится в расширении и никогда не отправляется в SoundCloud или облачный сервис.',
            backupTitle: 'Ручная резервная копия', backupDescription: 'Экспортируйте ограниченные JSON-файлы или добавьте записи из резервных копий.',
            exportButton: '📤 Экспорт JSON-копии', importLabel: 'Импорт JSON-копий (до 5 МиБ на файл)',
            importHint: 'Импорт только добавляет записи: существующие ID треков не изменяются.', deleteTitle: 'Удалить локальную историю',
            deleteDescription: 'Удалить все записи о прослушанных треках из расширения.', deleteButton: '🗑 Удалить всю историю',
            confirmDelete: 'Удалить всю историю прослушанных треков? Это действие нельзя отменить.', loading: 'Загрузка…', ready: 'Готово.',
            unavailable: 'Хранилище прослушанных треков недоступно.', exportProgress: 'Экспортировано треков: {done}…',
            exportDone: 'Сохранено треков: {count}, JSON-файлов: {parts}.', importProgress: 'Импортируется {file}…',
            importDone: 'Добавлено треков: {added} (существующих или повторных: {skipped}).', invalidFile: 'Неверный формат копии или слишком большой файл.',
            operationFailed: 'Операция не выполнена.', deleteDone: 'История прослушанных треков удалена.', noRecords: 'Прослушанных треков нет.'
        },
        vi: {
            title: '🎧 Lịch sử bài đã nghe', subtitle: 'FreshDig lưu các bài đã thực sự nghe trong bộ nhớ cục bộ của tiện ích.', languageLabel: 'Ngôn ngữ',
            statsTitle: 'Lịch sử cục bộ', countLabel: 'Bài hát', oldestLabel: 'Cũ nhất', newestLabel: 'Mới nhất',
            localOnly: 'Chỉ cục bộ: lịch sử được giữ trong tiện ích và không gửi đến SoundCloud hay dịch vụ đám mây.',
            backupTitle: 'Sao lưu thủ công', backupDescription: 'Xuất các tệp JSON có giới hạn hoặc thêm bản ghi từ tệp sao lưu.',
            exportButton: '📤 Xuất bản sao JSON', importLabel: 'Nhập tệp sao lưu JSON (tối đa 5 MiB mỗi tệp)',
            importHint: 'Nhập chỉ thêm dữ liệu: ID bài đã có sẽ không bị thay đổi.', deleteTitle: 'Xóa lịch sử cục bộ',
            deleteDescription: 'Xóa mọi bản ghi bài đã nghe khỏi tiện ích này.', deleteButton: '🗑 Xóa toàn bộ lịch sử',
            confirmDelete: 'Xóa toàn bộ lịch sử bài đã nghe? Không thể hoàn tác.', loading: 'Đang tải…', ready: 'Sẵn sàng.',
            unavailable: 'Không thể dùng bộ nhớ bài đã nghe.', exportProgress: 'Đang xuất {done} bài…',
            exportDone: 'Đã lưu {count} bài trong {parts} tệp JSON.', importProgress: 'Đang nhập {file}…',
            importDone: 'Đã thêm {added} bài ({skipped} bài đã có hoặc trùng).', invalidFile: 'Định dạng sao lưu không hợp lệ hoặc tệp quá lớn.',
            operationFailed: 'Thao tác thất bại.', deleteDone: 'Đã xóa lịch sử bài đã nghe.', noRecords: 'Chưa có bài đã nghe.'
        },
        es: {
            title: '🎧 Historial de canciones escuchadas', subtitle: 'FreshDig guarda localmente las canciones que realmente has escuchado.', languageLabel: 'Idioma',
            statsTitle: 'Historial local', countLabel: 'Canciones', oldestLabel: 'Más antigua', newestLabel: 'Más reciente',
            localOnly: 'Solo local: este historial permanece en la extensión y nunca se envía a SoundCloud ni a la nube.',
            backupTitle: 'Copia de seguridad manual', backupDescription: 'Exporta archivos JSON limitados o añade registros desde copias de seguridad.',
            exportButton: '📤 Exportar copia JSON', importLabel: 'Importar copias JSON (hasta 5 MiB por archivo)',
            importHint: 'La importación solo añade datos: los IDs existentes no se modifican.', deleteTitle: 'Eliminar historial local',
            deleteDescription: 'Eliminar todas las canciones escuchadas de esta extensión.', deleteButton: '🗑 Eliminar todo el historial',
            confirmDelete: '¿Eliminar todo el historial de canciones escuchadas? No se puede deshacer.', loading: 'Cargando…', ready: 'Listo.',
            unavailable: 'El almacenamiento de canciones escuchadas no está disponible.', exportProgress: 'Exportando {done} canciones…',
            exportDone: 'Se guardaron {count} canciones en {parts} archivos JSON.', importProgress: 'Importando {file}…',
            importDone: 'Se añadieron {added} canciones ({skipped} existentes o duplicadas).', invalidFile: 'El formato de copia no es válido o el archivo es demasiado grande.',
            operationFailed: 'La operación falló.', deleteDone: 'Se eliminó el historial de canciones escuchadas.', noRecords: 'No hay canciones escuchadas.'
        }
    };

    function resolveLanguage(value) {
        const requested = String(value || 'auto').toLowerCase();
        if (requested !== 'auto' && TEXTS[requested]) return requested;
        const browserLanguage = String((typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || 'en').toLowerCase();
        const match = Object.keys(TEXTS).find(function (lang) { return browserLanguage.indexOf(lang) === 0; });
        return match || 'en';
    }

    function interpolate(text, values) {
        return String(text || '').replace(/\{(\w+)\}/g, function (_, key) {
            return values && values[key] !== undefined ? String(values[key]) : '';
        });
    }

    function chromeRequest(message) {
        return new Promise(function (resolve) {
            let settled = false;
            function finish(response) {
                if (settled) return;
                settled = true;
                if (response && response.result !== undefined) resolve(response.result);
                else resolve(response || { ok: false, reason: 'error' });
            }
            try {
                const maybePromise = chrome.runtime.sendMessage(message, function (response) {
                    if (chrome.runtime.lastError) finish({ ok: false, reason: 'error' });
                    else finish(response);
                });
                if (maybePromise && typeof maybePromise.then === 'function') {
                    maybePromise.then(finish, function () { finish({ ok: false, reason: 'error' }); });
                }
            } catch (e) {
                finish({ ok: false, reason: 'error' });
            }
        });
    }

    function request(op, payload) {
        return chromeRequest(Object.assign({
            action: 'HEARD_HISTORY',
            requestId: 'heard_ui_' + Date.now() + '_' + (++requestSeq),
            op: op
        }, payload || {}));
    }

    function getStoredLanguage() {
        if (!chrome.storage || !chrome.storage.local || typeof chrome.storage.local.get !== 'function') return Promise.resolve('auto');
        return new Promise(function (resolve) {
            let settled = false;
            function finish(value) { if (settled) return; settled = true; resolve(value && value.preferredLanguage ? value.preferredLanguage : 'auto'); }
            try {
                const maybePromise = chrome.storage.local.get(['preferredLanguage'], finish);
                if (maybePromise && typeof maybePromise.then === 'function') maybePromise.then(finish, function () { finish(null); });
            } catch (e) { finish(null); }
        });
    }

    function setStatus(element, text, error) {
        element.textContent = text || '';
        element.classList.toggle('error', !!error);
    }

    function formatDate(value, language) {
        if (value === null || value === undefined) return '—';
        try {
            return new Intl.DateTimeFormat(language === 'auto' ? undefined : language, {
                dateStyle: 'medium', timeStyle: 'short'
            }).format(new Date(value));
        } catch (e) {
            return new Date(value).toISOString();
        }
    }

    function downloadJson(payload, filename) {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    function wait(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    document.addEventListener('DOMContentLoaded', async function () {
        const textElements = document.querySelectorAll('[data-i18n]');
        const languageSelect = document.getElementById('language');
        const exportButton = document.getElementById('export');
        const importInput = document.getElementById('import');
        const deleteButton = document.getElementById('delete');
        const status = document.getElementById('status');
        const countElement = document.getElementById('count');
        const oldestElement = document.getElementById('oldest');
        const newestElement = document.getElementById('newest');
        let selectedLanguage = await getStoredLanguage();
        let language = resolveLanguage(selectedLanguage);
        let texts = TEXTS[language];

        function applyTexts() {
            language = resolveLanguage(selectedLanguage);
            texts = TEXTS[language];
            textElements.forEach(function (element) {
                const key = element.getAttribute('data-i18n');
                if (texts[key]) element.textContent = texts[key];
            });
            document.documentElement.lang = language;
            languageSelect.value = Object.prototype.hasOwnProperty.call(TEXTS, selectedLanguage) ? selectedLanguage : 'auto';
            languageSelect.setAttribute('aria-label', texts.languageLabel);
        }

        function setBusy(busy) {
            exportButton.disabled = busy;
            deleteButton.disabled = busy;
            importInput.disabled = busy;
            languageSelect.disabled = busy;
        }

        async function refreshStats() {
            const result = await request('stats');
            if (!result || !result.ok) {
                countElement.textContent = '—';
                oldestElement.textContent = '—';
                newestElement.textContent = '—';
                setStatus(status, result && result.reason === 'unavailable' ? texts.unavailable : texts.operationFailed, true);
                return result;
            }
            countElement.textContent = String(result.count || 0);
            oldestElement.textContent = formatDate(result.oldestAt, language);
            newestElement.textContent = formatDate(result.newestAt, language);
            return result;
        }

        async function exportHistory() {
            setBusy(true);
            try {
                const stats = await request('stats');
                if (!stats || !stats.ok) throw new Error(stats && stats.reason === 'unavailable' ? texts.unavailable : texts.operationFailed);
                const expectedParts = Math.max(1, Math.ceil((Number(stats.count) || 0) / FILE_RECORD_LIMIT));
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                let cursor = null;
                let part = 1;
                let total = 0;
                let chunk = [];
                let finished = false;
                while (!finished) {
                    const page = await request('page', { cursor: cursor, limit: PAGE_SIZE });
                    if (!page || !page.ok) throw new Error(texts.operationFailed);
                    page.records.forEach(function (record) {
                        chunk.push(record);
                        total += 1;
                    });
                    if (chunk.length >= FILE_RECORD_LIMIT || page.done) {
                        const payload = {
                            schema: BACKUP_SCHEMA,
                            version: 1,
                            createdAt: new Date().toISOString(),
                            part: part,
                            parts: expectedParts,
                            count: chunk.length,
                            records: chunk
                        };
                        downloadJson(payload, 'freshdig-heard-history-' + timestamp + '-part-' + String(part).padStart(3, '0') + '-of-' + String(expectedParts).padStart(3, '0') + '.json');
                        part += 1;
                        chunk = [];
                        setStatus(status, interpolate(texts.exportProgress, { done: total }));
                        await wait(50);
                    }
                    finished = !!page.done;
                    cursor = page.nextCursor || null;
                    if (!finished && !cursor) throw new Error(texts.operationFailed);
                }
                if (total === 0) setStatus(status, texts.noRecords);
                else setStatus(status, interpolate(texts.exportDone, { count: total, parts: part - 1 }));
            } catch (e) {
                setStatus(status, e && e.message ? e.message : texts.operationFailed, true);
            } finally {
                setBusy(false);
                await refreshStats();
            }
        }

        async function readFile(file) {
            if (!file || Number(file.size) > MAX_IMPORT_BYTES) throw new Error(texts.invalidFile);
            const text = await file.text();
            if (text.length > MAX_IMPORT_BYTES) throw new Error(texts.invalidFile);
            let payload;
            try { payload = JSON.parse(text); } catch (e) { throw new Error(texts.invalidFile); }
            if (!payload || payload.schema !== BACKUP_SCHEMA || payload.version !== 1 || !Array.isArray(payload.records) || payload.records.length > FILE_RECORD_LIMIT) {
                throw new Error(texts.invalidFile);
            }
            const records = [];
            for (let i = 0; i < payload.records.length; i += 1) {
                const normalized = FreshDigHeardHistory.normalizeRecord(payload.records[i]);
                if (!normalized) throw new Error(texts.invalidFile);
                records.push(normalized);
            }
            return records;
        }

        async function addRecords(records) {
            let added = 0;
            let skipped = 0;
            for (let offset = 0; offset < records.length; offset += FreshDigHeardHistory.MAX_BATCH) {
                const batch = records.slice(offset, offset + FreshDigHeardHistory.MAX_BATCH);
                const unique = [];
                const seen = new Set();
                batch.forEach(function (record) {
                    if (seen.has(record.id)) { skipped += 1; return; }
                    seen.add(record.id);
                    unique.push(record);
                });
                const lookup = await request('lookup', { ids: unique.map(function (record) { return record.id; }) });
                if (!lookup || !lookup.ok) throw new Error(texts.operationFailed);
                const known = new Set(lookup.ids || []);
                const missing = unique.filter(function (record) { return !known.has(record.id); });
                skipped += unique.length - missing.length;
                if (!missing.length) continue;
                const put = await request('put', { records: missing });
                if (!put || !put.ok) throw new Error(texts.operationFailed);
                added += missing.length;
            }
            return { added: added, skipped: skipped };
        }

        async function importHistory() {
            const files = Array.from(importInput.files || []);
            if (!files.length) return;
            setBusy(true);
            let added = 0;
            let skipped = 0;
            try {
                for (let i = 0; i < files.length; i += 1) {
                    setStatus(status, interpolate(texts.importProgress, { file: files[i].name || String(i + 1) }));
                    const records = await readFile(files[i]);
                    const result = await addRecords(records);
                    added += result.added;
                    skipped += result.skipped;
                }
                setStatus(status, interpolate(texts.importDone, { added: added, skipped: skipped }));
            } catch (e) {
                setStatus(status, e && e.message ? e.message : texts.operationFailed, true);
            } finally {
                importInput.value = '';
                setBusy(false);
                await refreshStats();
            }
        }

        async function deleteHistory() {
            if (!window.confirm(texts.confirmDelete)) return;
            setBusy(true);
            try {
                const result = await request('clear');
                if (!result || !result.ok) throw new Error(result && result.reason === 'unavailable' ? texts.unavailable : texts.operationFailed);
                setStatus(status, texts.deleteDone);
            } catch (e) {
                setStatus(status, e && e.message ? e.message : texts.operationFailed, true);
            } finally {
                setBusy(false);
                await refreshStats();
            }
        }

        languageSelect.addEventListener('change', function () {
            selectedLanguage = languageSelect.value;
            if (chrome.storage && chrome.storage.local && typeof chrome.storage.local.set === 'function') {
                chrome.storage.local.set({ preferredLanguage: selectedLanguage });
            }
            applyTexts();
            void refreshStats();
        });
        exportButton.addEventListener('click', function () { void exportHistory(); });
        importInput.addEventListener('change', function () { void importHistory(); });
        deleteButton.addEventListener('click', function () { void deleteHistory(); });

        applyTexts();
        setStatus(status, texts.loading);
        await refreshStats();
        if (status.textContent === texts.loading) setStatus(status, texts.ready);
    });
}());
