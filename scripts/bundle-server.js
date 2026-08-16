// Copyright (C) 2017-2026 Smart code 203358507

// Puts the Stremio streaming server into the desktop app, copying it from a
// local Stremio installation. Override the source path with STREMIO_SERVER.
//
// The file is Stremio's own component and is not covered by this project's
// GPL-2.0 licence, which is why .gitignore currently keeps it out of the
// repository — meaning a machine that packages the app needs Stremio present.

const fs = require('fs');
const os = require('os');
const path = require('path');

const DESTINATION = path.join(__dirname, '..', 'electron', 'server.js');

const CANDIDATES = [
    process.env.STREMIO_SERVER,
    path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Stremio', 'server.js'),
    'C:\\Program Files\\Stremio\\server.js',
    '/usr/lib/stremio/server.js',
    '/Applications/Stremio.app/Contents/MacOS/server.js',
].filter(Boolean);

const source = CANDIDATES.find((candidate) => fs.existsSync(candidate));

if (source === undefined) {
    console.error('Could not find the Stremio streaming server.');
    console.error('Install Stremio, or point STREMIO_SERVER at its server.js, then run this again.');
    console.error('Looked in:');
    CANDIDATES.forEach((candidate) => console.error(`  ${candidate}`));
    process.exit(1);
}

fs.copyFileSync(source, DESTINATION);
console.log(`streaming server bundled from ${source} (${(fs.statSync(DESTINATION).size / 1048576).toFixed(1)} MB)`);
