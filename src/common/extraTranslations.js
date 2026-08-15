// Copyright (C) 2017-2026 Smart code 203358507

// Strings for Disclaw-only features, which the upstream stremio-translations
// package knows nothing about. Merged over it at i18n init; languages not
// listed here fall back to en-US like every other missing key.
const EXTRA_TRANSLATIONS = {
    'en-US': {
        DISCLAW_WATCHABLE_ONLY: 'Only show what I can watch',
    },
    'pt-BR': {
        DISCLAW_WATCHABLE_ONLY: 'Mostrar só o que dá pra assistir',
    },
    'pt-PT': {
        DISCLAW_WATCHABLE_ONLY: 'Mostrar só o que dá para ver',
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
