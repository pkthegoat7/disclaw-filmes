// Copyright (C) 2017-2026 Smart code 203358507

// Strings for Disclaw-only features, which the upstream stremio-translations
// package knows nothing about. Merged over it at i18n init; languages not
// listed here fall back to en-US like every other missing key.
const EXTRA_TRANSLATIONS = {
    'en-US': {
        DISCLAW_WATCHABLE_ONLY: 'Only show what I can watch',
        DISCLAW_HERO_PLAY: 'Watch',
        DISCLAW_HERO_INFO: 'More info',
    },
    'pt-BR': {
        DISCLAW_WATCHABLE_ONLY: 'Mostrar só o que dá pra assistir',
        DISCLAW_HERO_PLAY: 'Assistir',
        DISCLAW_HERO_INFO: 'Mais informações',
    },
    'pt-PT': {
        DISCLAW_WATCHABLE_ONLY: 'Mostrar só o que dá para ver',
        DISCLAW_HERO_PLAY: 'Ver',
        DISCLAW_HERO_INFO: 'Mais informação',
    },
};

const withExtraTranslations = (translations) => Object.fromEntries(
    Object.entries(translations).map(([language, strings]) => [
        language,
        { ...strings, ...EXTRA_TRANSLATIONS[language] }
    ])
);

module.exports = {
    EXTRA_TRANSLATIONS,
    withExtraTranslations,
};
