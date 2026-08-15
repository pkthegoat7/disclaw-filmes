#!/usr/bin/env node

// Copyright (C) 2017-2023 Smart code 203358507

const STATIC_CACHE = 86400;
const HASHED_CACHE = 31536000;
const HTTP_PORT = process.env.PORT || 8080;

const express = require('express');
const path = require('path');

const build_path = path.resolve(__dirname, 'build');
const index_path = path.join(build_path, 'index.html');
const service_worker_path = path.join(build_path, 'service-worker.js');

// Scripts, styles and binaries are emitted under a per-build directory, so
// their URL changes whenever their content does. Everything else — images,
// fonts, favicons, the manifest — keeps a stable name across builds and must
// not be pinned for long, or a rebrand would take a year to reach anyone.
const HASHED = /[\\/](?:scripts|styles|binaries)[\\/]/;

express().use(express.static(build_path, {
    setHeaders: (res, filePath) => {
        if (filePath === index_path || filePath === service_worker_path) {
            // Both must be revalidated every time. The index names the hashed
            // assets and a deploy deletes the previous build's files, so a
            // stale copy would point the browser at files that no longer
            // exist; a stale worker would keep serving the old app from its
            // own precache.
            res.set('cache-control', 'no-cache');
        } else if (HASHED.test(filePath)) {
            res.set('cache-control', `public, max-age=${HASHED_CACHE}, immutable`);
        } else {
            res.set('cache-control', `public, max-age=${STATIC_CACHE}`);
        }
    }
})).all('*', (_req, res) => {
    // TODO: better 404 page
    res.status(404).send('<h1>404! Page not found</h1>');
}).listen(HTTP_PORT, () => console.info(`Server listening on port: ${HTTP_PORT}`));
