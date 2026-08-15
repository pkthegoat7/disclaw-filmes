// Copyright (C) 2017-2026 Smart code 203358507

const React = require('react');
const { useCore } = require('stremio/core');
const useProfile = require('stremio/common/useProfile');

// Addons every fresh Disclaw profile starts with, on top of the official set
// the core installs by itself. Transport URLs carry their configuration, so
// keep the query segment (Torrentio's language, for one) when editing these.
const DEFAULT_ADDONS = [
    'https://7a82163c306e-stremio-netflix-catalog-addon.baby-beamup.club/manifest.json',
    'https://torrentio.strem.fun/language=portuguese/manifest.json',
    'https://27a5b2bfe3c0-stremio-brazilian-addon.baby-beamup.club/manifest.json',
];

// Keyed per account, not per browser. Logging in swaps the whole addon
// collection for the one synced from the Stremio account, so a single marker
// would let the defaults apply to the anonymous profile and never to the
// account the user actually watches on.
const seededKey = (profile) => `disclaw.addonsSeeded:${profile.auth?.user?._id ?? 'anonymous'}`;

// The marker records which URLs were seeded rather than a plain "done", so
// growing DEFAULT_ADDONS reaches accounts seeded by an earlier version while
// an addon the user removed on purpose is still never pushed back.
// Markers written before this were a bare 'true', and only ever by versions
// whose defaults were exactly these two.
const LEGACY_SEEDED = [
    'https://7a82163c306e-stremio-netflix-catalog-addon.baby-beamup.club/manifest.json',
    'https://torrentio.strem.fun/language=portuguese/manifest.json',
];

const readSeeded = (key) => {
    const stored = window.localStorage.getItem(key);
    if (stored === null) return [];
    if (stored === 'true') return LEGACY_SEEDED;

    try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const install = (core, transportUrl, manifest) => {
    core.transport.dispatch({
        action: 'Ctx',
        args: {
            action: 'InstallAddon',
            args: {
                transportUrl,
                manifest,
                flags: {
                    official: false,
                    protected: false
                }
            }
        }
    });
};

// Seeded once per account: from then on the addon list belongs to the user, so
// an addon they uninstall stays uninstalled. The marker is only written once
// every addon actually landed, otherwise a failed first load (offline, addon
// down) would silently cost them the defaults forever.
//
// For a signed-in account the core pushes the result to Stremio, so this shows
// up on the user's other devices too — deliberate, that is the point of having
// defaults, but it does mean the seeding is not confined to this browser.
const useDefaultAddons = () => {
    const core = useCore();
    const profile = useProfile();
    const seeding = React.useRef(false);

    const key = seededKey(profile);

    React.useEffect(() => {
        if (!Array.isArray(profile.addons) || seeding.current) return;

        const seeded = readSeeded(key);
        const pending = DEFAULT_ADDONS.filter((transportUrl) => !seeded.includes(transportUrl));
        if (pending.length === 0) return;

        const done = () => window.localStorage.setItem(key, JSON.stringify(DEFAULT_ADDONS));

        const installed = profile.addons.map(({ transportUrl }) => transportUrl);
        const missing = pending.filter((transportUrl) => !installed.includes(transportUrl));
        if (missing.length === 0) {
            done();
            return;
        }

        seeding.current = true;
        Promise.all(missing.map((transportUrl) =>
            fetch(transportUrl)
                .then((response) => response.json())
                .then((manifest) => install(core, transportUrl, manifest))
        ))
            .then(done)
            .catch((error) => console.error('Failed to install default addons:', error))
            .then(() => {
                seeding.current = false;
            });
    }, [profile.addons, key]);
};

module.exports = useDefaultAddons;
module.exports.DEFAULT_ADDONS = DEFAULT_ADDONS;
