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
];

const SEEDED_KEY = 'disclaw.addonsSeeded';

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

// Seeded once per browser: from then on the addon list belongs to the user,
// so an addon they uninstall stays uninstalled. The marker is only written
// once every addon actually landed, otherwise a failed first load (offline,
// addon down) would silently cost them the defaults forever.
const useDefaultAddons = () => {
    const core = useCore();
    const profile = useProfile();
    const seeding = React.useRef(false);

    React.useEffect(() => {
        if (!Array.isArray(profile.addons) || seeding.current) return;
        if (window.localStorage.getItem(SEEDED_KEY)) return;

        const installed = profile.addons.map(({ transportUrl }) => transportUrl);
        const missing = DEFAULT_ADDONS.filter((transportUrl) => !installed.includes(transportUrl));
        if (missing.length === 0) {
            window.localStorage.setItem(SEEDED_KEY, 'true');
            return;
        }

        seeding.current = true;
        Promise.all(missing.map((transportUrl) =>
            fetch(transportUrl)
                .then((response) => response.json())
                .then((manifest) => install(core, transportUrl, manifest))
        ))
            .then(() => window.localStorage.setItem(SEEDED_KEY, 'true'))
            .catch((error) => console.error('Failed to install default addons:', error))
            .then(() => {
                seeding.current = false;
            });
    }, [profile.addons]);
};

module.exports = useDefaultAddons;
module.exports.DEFAULT_ADDONS = DEFAULT_ADDONS;
