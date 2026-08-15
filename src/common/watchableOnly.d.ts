// Copyright (C) 2017-2026 Smart code 203358507

declare function useWatchableOnly(): [boolean, (value: boolean) => void];

declare namespace useWatchableOnly {
    const WATCHABLE_ONLY_KEY: string;
    function getWatchableOnly(): boolean;
    function setWatchableOnly(value: boolean): void;
}

export = useWatchableOnly;
