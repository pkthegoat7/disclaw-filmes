// Copyright (C) 2017-2026 Smart code 203358507

// Catalogs list titles regardless of whether any addon can actually play them,
// so "watchable" has to be measured by asking the installed stream addons.
// Answers are cached for a week — addons are free public services and a
// catalog scroll would otherwise fire hundreds of requests per session.

const CACHE_KEY = 'disclaw.streamAvailability';
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7;
const CONCURRENCY = 6;

const readCache = () => {
    try {
        const stored = JSON.parse(window.localStorage.getItem(CACHE_KEY));
        if (stored === null || typeof stored !== 'object') return {};
        const fresh = {};
        Object.keys(stored).forEach((key) => {
            if (Date.now() - stored[key].at < CACHE_TTL) fresh[key] = stored[key];
        });
        return fresh;
    } catch {
        return {};
    }
};

const cache = readCache();
const pending = new Map();
let flushHandle = null;

const flush = () => {
    flushHandle = null;
    try {
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        // Storage full or blocked — the in-memory cache still holds for this session.
        console.error('Failed to persist stream availability cache:', error);
    }
};

const scheduleFlush = () => {
    if (flushHandle !== null) return;
    flushHandle = window.setTimeout(flush, 2000);
};

// A resource is either the plain name or an object narrowing it by type/id.
const supportsStream = (addon, type, id) => (addon.manifest.resources || []).some((resource) => {
    const name = typeof resource === 'string' ? resource : resource.name;
    if (name !== 'stream') return false;

    const types = (typeof resource === 'object' && resource.types) || addon.manifest.types || [];
    if (types.length > 0 && !types.includes(type)) return false;

    const prefixes = (typeof resource === 'object' && resource.idPrefixes) || addon.manifest.idPrefixes;
    return !Array.isArray(prefixes) || prefixes.some((prefix) => id.startsWith(prefix));
});

const query = async (addon, type, id) => {
    const base = addon.transportUrl.replace(/\/manifest\.json$/, '');
    const response = await fetch(`${base}/stream/${type}/${encodeURIComponent(id)}.json`);
    if (!response.ok) return false;
    const { streams } = await response.json();
    return Array.isArray(streams) && streams.length > 0;
};

// One addon being down must not be read as "nothing to watch", so a failure is
// distinguished from an empty answer: an item is only marked unwatchable when
// every capable addon answered and none had a stream.
const resolve = async (addons, item) => {
    const capable = addons.filter((addon) => supportsStream(addon, item.type, item.id));
    if (capable.length === 0) return null;

    const results = await Promise.all(capable.map((addon) =>
        query(addon, item.type, item.id).catch(() => null)
    ));

    if (results.some((result) => result === true)) return true;
    return results.every((result) => result === false) ? false : null;
};

const getCached = (item) => {
    const entry = cache[`${item.type}:${item.id}`];
    return entry === undefined ? undefined : entry.watchable;
};

// Resolves the given items in small batches, calling onResolved as answers land
// so the caller can re-render progressively. Returns a function that abandons
// the remaining work when the caller unmounts or its input changes.
const resolveAll = (addons, items, onResolved) => {
    let abandoned = false;
    const queue = items.filter((item) => getCached(item) === undefined && !pending.has(`${item.type}:${item.id}`));

    const next = async () => {
        while (!abandoned) {
            const item = queue.shift();
            if (item === undefined) return;

            const key = `${item.type}:${item.id}`;
            const request = resolve(addons, item);
            pending.set(key, request);

            const watchable = await request;
            pending.delete(key);

            if (watchable !== null) {
                cache[key] = { watchable, at: Date.now() };
                scheduleFlush();
            }

            if (!abandoned) onResolved();
        }
    };

    for (let i = 0; i < CONCURRENCY; i++) next();

    return () => {
        abandoned = true;
    };
};

module.exports = {
    getCached,
    resolveAll,
};
