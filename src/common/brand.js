// Copyright (C) 2017-2026 Smart code 203358507

const APP_NAME = 'Disclaw';

// Disclaw ships in Portuguese. The core profile still owns the interface
// language, so this is only the initial value — seeded once, then never forced
// again (see LANGUAGE_SEEDED_KEY).
const DEFAULT_LANGUAGE = 'pt-BR';
const LANGUAGE_SEEDED_KEY = 'disclaw.languageSeeded';

// Upstream translations hardcode the original product name. Swap the standalone
// word only — the lowercase form is part of domains (www.stremio.com) and addon
// ids (org.stremio.*), which must stay untouched.
const BRAND_REGEXP = /\bStremio\b(?!\.)/g;

const brandText = (text) => text.replace(BRAND_REGEXP, APP_NAME);

const brandTranslations = (translations) => Object.fromEntries(
    Object.entries(translations).map(([language, strings]) => [
        language,
        Object.fromEntries(
            Object.entries(strings).map(([key, value]) => [
                key,
                typeof value === 'string' ? brandText(value) : value
            ])
        )
    ])
);

module.exports = {
    APP_NAME,
    DEFAULT_LANGUAGE,
    LANGUAGE_SEEDED_KEY,
    brandText,
    brandTranslations,
};
