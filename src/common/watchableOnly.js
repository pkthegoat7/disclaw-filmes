// Copyright (C) 2017-2026 Smart code 203358507

const React = require('react');

// "Only show what I can actually watch". This is a Disclaw addition, so it
// can't live in the core profile — that settings schema is fixed by the
// prebuilt WASM core — hence a plain local flag shared through a store.
const WATCHABLE_ONLY_KEY = 'disclaw.watchableOnly';

const listeners = new Set();
let enabled = window.localStorage.getItem(WATCHABLE_ONLY_KEY) === 'true';

const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const getWatchableOnly = () => enabled;

const setWatchableOnly = (value) => {
    if (value === enabled) return;
    enabled = value;
    window.localStorage.setItem(WATCHABLE_ONLY_KEY, String(value));
    listeners.forEach((listener) => listener());
};

const useWatchableOnly = () => [
    React.useSyncExternalStore(subscribe, getWatchableOnly),
    setWatchableOnly,
];

module.exports = useWatchableOnly;
module.exports.WATCHABLE_ONLY_KEY = WATCHABLE_ONLY_KEY;
module.exports.getWatchableOnly = getWatchableOnly;
module.exports.setWatchableOnly = setWatchableOnly;
