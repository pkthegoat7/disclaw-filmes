// Copyright (C) 2017-2026 Smart code 203358507

const React = require('react');
const useProfile = require('stremio/common/useProfile');
const useWatchableOnly = require('stremio/common/watchableOnly');
const { getCached, resolveAll } = require('stremio/common/streamAvailability');

// Cheap first pass: an unreleased title has nothing to play by definition, so
// it can be dropped without asking any addon. Returns null when the catalog
// gave no usable date — those fall through to the stream check rather than
// being hidden on a guess.
const isReleased = (item) => {
    if (item.released instanceof Date && !isNaN(item.released.getTime())) {
        return item.released.getTime() <= Date.now();
    }

    // releaseInfo is a year, or a range for series: "2019", "2019-", "2019-2023".
    const year = parseInt(String(item.releaseInfo ?? '').slice(0, 4), 10);
    return isNaN(year) ? null : year <= new Date().getFullYear();
};

// Unknown means "not answered yet" — keep showing the item until an addon
// actually says there is nothing, so the grid fills in rather than flickering.
const isWatchable = (item) => isReleased(item) !== false && getCached(item) !== false;

// Drives the background stream lookups and re-renders as answers land.
const useWatchableFilter = (items) => {
    const [watchableOnly] = useWatchableOnly();
    const profile = useProfile();
    const [version, onResolved] = React.useReducer((count) => count + 1, 0);
    const addons = profile.addons;

    React.useEffect(() => {
        if (!watchableOnly || !Array.isArray(addons) || items.length === 0) return;

        const unresolved = items.filter((item) => isReleased(item) !== false && getCached(item) === undefined);
        if (unresolved.length === 0) return;

        return resolveAll(addons, unresolved, onResolved);
    }, [watchableOnly, items, addons]);

    return [watchableOnly, version];
};

// Discover and other flat grids.
const useWatchableItems = (items) => {
    const list = React.useMemo(() => items ?? [], [items]);
    const [watchableOnly, version] = useWatchableFilter(list);

    return React.useMemo(() => (
        watchableOnly ? list.filter(isWatchable) : list
    ), [watchableOnly, list, version]);
};

// Board and Search, which render one row per catalog. A row emptied by the
// filter becomes an empty-content error rather than disappearing: both screens
// load rows lazily by their index in this array, so dropping entries would
// point those requests at the wrong rows. The empty-content branch already
// renders nothing, and it also keeps the row components from reading a poster
// shape off a first item that is no longer there.
const EMPTY_CONTENT = { type: 'Err', content: 'EmptyContent' };

const useWatchableCatalogs = (catalogs) => {
    const list = React.useMemo(() => catalogs ?? [], [catalogs]);
    const items = React.useMemo(() => list.flatMap((catalog) => (
        catalog.content?.type === 'Ready' ? catalog.content.content : []
    )), [list]);

    const [watchableOnly, version] = useWatchableFilter(items);

    return React.useMemo(() => {
        if (!watchableOnly) return list;

        return list.map((catalog) => {
            if (catalog.content?.type !== 'Ready') return catalog;

            const content = catalog.content.content.filter(isWatchable);
            if (content.length === catalog.content.content.length) return catalog;

            return {
                ...catalog,
                content: content.length > 0 ? { ...catalog.content, content } : EMPTY_CONTENT
            };
        });
    }, [watchableOnly, list, version]);
};

module.exports = {
    useWatchableItems,
    useWatchableCatalogs,
};
