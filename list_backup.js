(function (root, factory) {
    'use strict';
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.FreshDigLists = factory();
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const FORMAT = 'FreshDigLists';
    const SCHEMA = 1;
    const MAX_JSON_BYTES = 5 * 1024 * 1024;
    const MAX_LATER_ARTISTS = 500;
    const MAX_MAP_ENTRIES = 10000;
    const MAX_ARRAY_ITEMS = 10000;
    const MAX_STRING_LENGTH = 4096;
    const MAX_KEY_LENGTH = 512;
    const MAX_OBJECT_PROPERTIES = 64;
    const MAX_DEPTH = 8;
    const LIST_KEYS = ['laterArtists', 'dislikedTracks', 'dislikedArtists', 'dislikedGenres'];
    const LIST_KEY_SET = new Set(LIST_KEYS);
    const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
    const RESERVED_MAP_KEYS = new Set(['undefined', 'null', 'unknown', 'title_unknown', 'artist_unknown']);

    function hasOwn(value, key) {
        return Object.prototype.hasOwnProperty.call(value, key);
    }

    function isPlainObject(value) {
        if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
        const proto = Object.getPrototypeOf(value);
        return proto === Object.prototype || proto === null;
    }

    function invalid(message) {
        throw new Error('Invalid FreshDigLists backup: ' + message);
    }

    function assertSafeProperty(key) {
        if (DANGEROUS_KEYS.has(key)) invalid('unsafe property name "' + key + '"');

        // List data must never be a way to carry credentials or API material.
        const compact = String(key).replace(/[\s_-]/g, '').toLowerCase();
        if (compact.indexOf('token') !== -1 || compact.indexOf('secret') !== -1 ||
            compact.indexOf('password') !== -1 || compact.indexOf('credential') !== -1 ||
            compact === 'authorization' || compact === 'cookie' ||
            compact === 'clientid' || compact === 'apikey') {
            invalid('credential-like property "' + key + '"');
        }
    }

    function assertFiniteNumber(value, path) {
        if (typeof value !== 'number' || !Number.isFinite(value) ||
            Math.abs(value) > Number.MAX_SAFE_INTEGER) {
            invalid(path + ' must be a finite number');
        }
    }

    function cloneValue(value, path, depth, stack) {
        if (depth > MAX_DEPTH) invalid(path + ' is too deeply nested');
        if (value === null || typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            if (value.length > MAX_STRING_LENGTH) invalid(path + ' is too long');
            return value;
        }
        if (typeof value === 'number') {
            assertFiniteNumber(value, path);
            return value;
        }
        if (typeof value !== 'object') invalid(path + ' has an unsupported value');

        if (stack.has(value)) invalid(path + ' contains a circular reference');
        stack.add(value);

        let result;
        if (Array.isArray(value)) {
            if (value.length > MAX_ARRAY_ITEMS) invalid(path + ' has too many items');
            const ownKeys = Object.keys(value);
            if (ownKeys.length !== value.length) invalid(path + ' must be a dense array');
            result = [];
            for (let i = 0; i < value.length; i += 1) {
                result.push(cloneValue(value[i], path + '[' + i + ']', depth + 1, stack));
            }
        } else {
            if (!isPlainObject(value)) invalid(path + ' must be a plain object');
            const keys = Object.keys(value);
            if (keys.length > MAX_OBJECT_PROPERTIES) invalid(path + ' has too many properties');
            result = {};
            keys.forEach(function (key) {
                assertSafeProperty(key);
                result[key] = cloneValue(value[key], path + '.' + key, depth + 1, stack);
            });
        }
        stack.delete(value);
        return result;
    }

    function validateMapKey(key, path) {
        if (typeof key !== 'string') invalid(path + ' must be a string');
        if (!key.trim() || key.length > MAX_KEY_LENGTH) invalid(path + ' is empty or too long');
        const trimmed = key.trim();
        // Map keys are opaque SoundCloud IDs/title_/artist_ keys.  Credential
        // checks belong to record property names; a song or genre may itself
        // legitimately contain words such as "Token", "Secret", or "Unknown".
        if (DANGEROUS_KEYS.has(key) || RESERVED_MAP_KEYS.has(trimmed.toLowerCase()) ||
            trimmed === 'title_' || trimmed === 'artist_' || trimmed === '0' || trimmed === 'NaN') {
            invalid(path + ' is not a valid list key');
        }
    }

    function validateArtistId(value, path) {
        if (typeof value === 'number') {
            if (!Number.isFinite(value) || value <= 0 || value > Number.MAX_SAFE_INTEGER) {
                invalid(path + ' must be a positive id');
            }
            return;
        }
        if (typeof value !== 'string' || !value.trim() || value.length > MAX_KEY_LENGTH) {
            invalid(path + ' must be a non-empty id');
        }
        const lower = value.trim().toLowerCase();
        if (lower === 'undefined' || lower === 'null') invalid(path + ' must be a real id');
    }

    function cloneMap(value, name) {
        if (!isPlainObject(value)) invalid('lists.' + name + ' must be an object');
        const keys = Object.keys(value);
        if (keys.length > MAX_MAP_ENTRIES) invalid('lists.' + name + ' has too many entries');
        const result = {};
        keys.forEach(function (key) {
            validateMapKey(key, 'lists.' + name + '[' + key + ']');
            result[key] = cloneValue(value[key], 'lists.' + name + '[' + key + ']', 0, new Set());
        });
        return result;
    }

    function cloneLaterArtists(value) {
        if (!Array.isArray(value)) invalid('lists.laterArtists must be an array');
        if (value.length > MAX_LATER_ARTISTS) invalid('lists.laterArtists exceeds the 500 item limit');
        const result = [];
        const ids = new Set();
        value.forEach(function (item, index) {
            if (!isPlainObject(item)) invalid('lists.laterArtists[' + index + '] must be an object');
            if (!hasOwn(item, 'artistId')) invalid('lists.laterArtists[' + index + '] is missing artistId');
            validateArtistId(item.artistId, 'lists.laterArtists[' + index + '].artistId');
            const id = String(item.artistId);
            if (ids.has(id)) invalid('lists.laterArtists contains duplicate artistId ' + id);
            ids.add(id);
            result.push(cloneValue(item, 'lists.laterArtists[' + index + ']', 0, new Set()));
        });
        return result;
    }

    function normalizeLists(value, path) {
        const prefix = path || 'lists';
        if (!isPlainObject(value)) invalid(prefix + ' must be an object');
        Object.keys(value).forEach(function (key) {
            if (!LIST_KEY_SET.has(key)) invalid(prefix + ' has an unrecognized property "' + key + '"');
        });
        LIST_KEYS.forEach(function (key) {
            if (!hasOwn(value, key)) invalid(prefix + ' is missing ' + key);
        });
        return {
            laterArtists: cloneLaterArtists(value.laterArtists),
            dislikedTracks: cloneMap(value.dislikedTracks, 'dislikedTracks'),
            dislikedArtists: cloneMap(value.dislikedArtists, 'dislikedArtists'),
            dislikedGenres: cloneMap(value.dislikedGenres, 'dislikedGenres')
        };
    }

    function utf8ByteLength(value) {
        if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value).length;
        if (typeof Buffer !== 'undefined' && Buffer.byteLength) return Buffer.byteLength(value, 'utf8');
        return unescape(encodeURIComponent(value)).length;
    }

    function assertEnvelopeSize(envelope) {
        let text;
        try {
            text = JSON.stringify(envelope);
        } catch (e) {
            invalid('cannot be serialized');
        }
        if (utf8ByteLength(text) > MAX_JSON_BYTES) invalid('file exceeds the 5 MiB limit');
    }

    function normalize(envelope) {
        if (!isPlainObject(envelope)) invalid('root must be an object');
        Object.keys(envelope).forEach(function (key) {
            if (key !== 'format' && key !== 'schema' && key !== 'exportedAt' && key !== 'lists') {
                invalid('unrecognized root property "' + key + '"');
            }
            assertSafeProperty(key);
        });
        if (envelope.format !== FORMAT) invalid('format is not FreshDigLists');
        if (envelope.schema !== SCHEMA) invalid('unsupported schema version');
        if (typeof envelope.exportedAt !== 'string' || !envelope.exportedAt.trim() ||
            !Number.isFinite(Date.parse(envelope.exportedAt))) {
            invalid('exportedAt must be a valid date');
        }
        if (!hasOwn(envelope, 'lists')) invalid('lists is missing');
        const normalized = {
            format: FORMAT,
            schema: SCHEMA,
            exportedAt: envelope.exportedAt,
            lists: normalizeLists(envelope.lists, 'lists')
        };
        assertEnvelopeSize(normalized);
        return normalized;
    }

    function create(lists) {
        const normalizedLists = normalizeLists(lists, 'lists');
        const envelope = {
            format: FORMAT,
            schema: SCHEMA,
            exportedAt: new Date().toISOString(),
            lists: normalizedLists
        };
        assertEnvelopeSize(envelope);
        return envelope;
    }

    function merge(currentLists, incomingLists) {
        const current = normalizeLists(currentLists, 'current lists');
        const incoming = normalizeLists(incomingLists, 'incoming lists');
        const merged = {
            laterArtists: current.laterArtists.slice(),
            dislikedTracks: Object.assign({}, current.dislikedTracks),
            dislikedArtists: Object.assign({}, current.dislikedArtists),
            dislikedGenres: Object.assign({}, current.dislikedGenres)
        };

        const existingLaterIds = new Set(merged.laterArtists.map(function (item) { return String(item.artistId); }));
        incoming.laterArtists.forEach(function (item) {
            const id = String(item.artistId);
            if (!existingLaterIds.has(id)) {
                if (merged.laterArtists.length >= MAX_LATER_ARTISTS) {
                    invalid('merged lists would exceed the 500 later artist limit');
                }
                existingLaterIds.add(id);
                merged.laterArtists.push(item);
            }
        });

        ['dislikedTracks', 'dislikedArtists', 'dislikedGenres'].forEach(function (name) {
            Object.keys(incoming[name]).forEach(function (key) {
                if (!hasOwn(merged[name], key)) merged[name][key] = incoming[name][key];
            });
        });

        // Keep a final finite bound check in case the constants are changed later.
        normalizeLists(merged, 'merged lists');
        return merged;
    }

    function counts(lists) {
        const normalized = normalizeLists(lists, 'lists');
        return {
            laterArtists: normalized.laterArtists.length,
            dislikedTracks: Object.keys(normalized.dislikedTracks).length,
            dislikedArtists: Object.keys(normalized.dislikedArtists).length,
            dislikedGenres: Object.keys(normalized.dislikedGenres).length
        };
    }

    function markdownEscape(value) {
        return String(value === undefined || value === null ? '' : value)
            .replace(/[\\`*_[\]()<>&#|]/g, '\\$&')
            .replace(/\b(javascript|data|vbscript):/gi, '$1\\:')
            .replace(/[\r\n]+/g, ' ')
            .trim();
    }

    function safeSoundCloudUrl(permalink) {
        if (permalink === undefined || permalink === null) return '';
        const raw = String(permalink).trim();
        if (!raw || raw.length > MAX_KEY_LENGTH || /[\s?#]/.test(raw)) return '';
        if (/^https?:\/\//i.test(raw)) {
            try {
                const parsed = new URL(raw);
                if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== 'soundcloud.com') return '';
                const path = parsed.pathname.replace(/^\/+/, '').split('/').filter(Boolean);
                if (path.length !== 1) return '';
                return 'https://soundcloud.com/' + encodeURIComponent(path[0]);
            } catch (e) {
                return '';
            }
        }
        if (raw.indexOf('/') !== -1 || raw.indexOf('\\') !== -1 || raw.indexOf(':') !== -1) return '';
        return 'https://soundcloud.com/' + encodeURIComponent(raw);
    }

    function recordLabel(key, record) {
        if (record && typeof record === 'object' && !Array.isArray(record)) {
            return record.name || record.title || record.artist || record.genre || key;
        }
        return key;
    }

    function recordDate(record) {
        if (!record || typeof record !== 'object' || Array.isArray(record)) return '';
        if (record.date !== undefined && record.date !== null) return String(record.date);
        if (record.addedAt !== undefined && record.addedAt !== null) return String(record.addedAt);
        return '';
    }

    function mapMarkdown(title, map) {
        const lines = ['## ' + title + ' (' + Object.keys(map).length + ')'];
        const keys = Object.keys(map).sort();
        if (!keys.length) {
            lines.push('_None_');
            return lines;
        }
        keys.forEach(function (key) {
            const record = map[key];
            const label = markdownEscape(recordLabel(key, record));
            const url = record && typeof record === 'object' && !Array.isArray(record)
                ? safeSoundCloudUrl(record.permalink) : '';
            const linked = url ? '[' + label + '](' + url + ')' : label;
            const date = recordDate(record);
            const details = date ? ' — ' + markdownEscape(date) : '';
            lines.push('- ' + linked + ' (`' + markdownEscape(key) + '`)' + details);
        });
        return lines;
    }

    function toMarkdown(envelope) {
        const normalized = normalize(envelope);
        const lists = normalized.lists;
        const lines = [
            '# FreshDig lists backup',
            '',
            '- Format: `' + FORMAT + '`',
            '- Schema: `' + SCHEMA + '`',
            '- Exported: ' + markdownEscape(normalized.exportedAt),
            ''
        ];
        lines.push('## Later artists (' + lists.laterArtists.length + ')');
        if (!lists.laterArtists.length) {
            lines.push('_None_');
        } else {
            lists.laterArtists.forEach(function (item) {
                const label = markdownEscape(item.name || item.artistId);
                const url = safeSoundCloudUrl(item.permalink);
                const linked = url ? '[' + label + '](' + url + ')' : label;
                const date = item.addedAt === undefined || item.addedAt === null ? '' :
                    ' — ' + markdownEscape(item.addedAt);
                lines.push('- ' + linked + ' (`' + markdownEscape(item.artistId) + '`)' + date);
            });
        }
        lines.push('');
        lines.push.apply(lines, mapMarkdown('Disliked tracks', lists.dislikedTracks));
        lines.push('');
        lines.push.apply(lines, mapMarkdown('Disliked artists', lists.dislikedArtists));
        lines.push('');
        lines.push.apply(lines, mapMarkdown('Disliked genres', lists.dislikedGenres));
        lines.push('');
        return lines.join('\n');
    }

    return Object.freeze({
        FORMAT: FORMAT,
        SCHEMA: SCHEMA,
        MAX_JSON_BYTES: MAX_JSON_BYTES,
        MAX_LATER_ARTISTS: MAX_LATER_ARTISTS,
        create: create,
        normalize: normalize,
        merge: merge,
        counts: counts,
        toMarkdown: toMarkdown
    });
}));
