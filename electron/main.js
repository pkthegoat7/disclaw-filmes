// Copyright (C) 2017-2026 Smart code 203358507

// Desktop shell for Disclaw. Two jobs the browser cannot do on its own:
//
//   1. Run the Stremio streaming server, which is what turns a torrent into
//      something playable. Without it the player has nothing to play.
//   2. Get past that server's origin whitelist. It answers with CORS headers
//      only for Stremio's own domains, so any other page — including a
//      self-hosted Disclaw — is blocked by the browser. Here the responses can
//      be rewritten on their way in, which is why this has to be an app.

const { app, BrowserWindow, session, shell } = require('electron');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const STREAMING_SERVER = 'http://127.0.0.1:11470';

// Fixed, because the origin is the identity under which the browser keeps
// local storage. A random port would hand the app a brand new, empty profile
// on every launch — no login, no addons, no library.
const UI_PORT = 11471;
const BUILD_DIR = path.join(__dirname, '..', 'build');
const SERVER_SCRIPT = path.join(__dirname, 'server.js');

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.wasm': 'application/wasm',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.ttf': 'font/ttf',
    '.woff2': 'font/woff2',
};

let streamingServer = null;
let mainWindow = null;

// The app is served over http rather than file:// because the core is a
// WebAssembly module running in a worker, and file:// origins cannot load it.
const serveUI = () => new Promise((resolve) => {
    const server = http.createServer((req, res) => {
        const url = decodeURIComponent(req.url.split('?')[0]);
        let file = path.join(BUILD_DIR, url === '/' ? 'index.html' : url);

        if (!file.startsWith(BUILD_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
            file = path.join(BUILD_DIR, 'index.html');
        }

        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
        fs.createReadStream(file).pipe(res);
    });

    server.listen(UI_PORT, '127.0.0.1', () => resolve(`http://127.0.0.1:${UI_PORT}`));
});

const isServerUp = () => new Promise((resolve) => {
    const request = http.get(`${STREAMING_SERVER}/settings`, (res) => {
        res.resume();
        resolve(res.statusCode === 200);
    });
    request.on('error', () => resolve(false));
    request.setTimeout(2000, () => {
        request.destroy();
        resolve(false);
    });
});

const startStreamingServer = async () => {
    // Something is already serving 11470 — Stremio itself, or an instance of
    // this app still shutting down. Starting a second one only loses the race
    // for the port and leaves the app quietly without a server.
    if (await isServerUp()) {
        console.log('Streaming server already running — reusing it.');
        return;
    }

    if (!fs.existsSync(SERVER_SCRIPT)) {
        console.error(`Streaming server missing at ${SERVER_SCRIPT} — torrents will not play. See README.`);
        return;
    }

    // ELECTRON_RUN_AS_NODE turns the bundled Electron binary into a plain node,
    // so the app carries its own runtime and does not need node installed.
    streamingServer = spawn(process.execPath, [SERVER_SCRIPT], {
        env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
        stdio: 'ignore',
        windowsHide: true,
    });

    streamingServer.on('error', (error) => console.error('Streaming server failed to start:', error));
    streamingServer.on('exit', (code) => {
        streamingServer = null;
        if (code !== 0) console.error(`Streaming server exited with code ${code} — torrents will not play.`);
    });
};

// Narrow on purpose: only responses from the streaming server are touched, and
// only to add the header it withholds. Disabling web security wholesale would
// have been fewer lines and far more of a hole.
const allowStreamingServer = (origin) => {
    session.defaultSession.webRequest.onHeadersReceived({ urls: [`${STREAMING_SERVER}/*`] }, (details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'access-control-allow-origin': [origin],
                'access-control-allow-headers': ['*'],
                'access-control-allow-methods': ['GET, POST, OPTIONS'],
            },
        });
    });
};

const createWindow = async () => {
    const origin = await serveUI();
    allowStreamingServer(origin);

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 860,
        minWidth: 800,
        minHeight: 600,
        backgroundColor: '#0b0b0f',
        autoHideMenuBar: true,
        icon: path.join(__dirname, '..', 'assets', 'images', 'icon_512x512.png'),
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.loadURL(origin);

    // DISCLAW_DEBUG=1 mirrors the renderer's console into this process's stdout
    // and reports whether it can actually reach the streaming server, which is
    // otherwise invisible from outside the app window.
    if (process.env.DISCLAW_DEBUG) {
        mainWindow.webContents.on('console-message', (_event, level, message) => {
            console.log(`[renderer:${level}] ${message}`);
        });

        mainWindow.webContents.once('did-finish-load', async () => {
            const probe = await mainWindow.webContents.executeJavaScript(`
                fetch('${STREAMING_SERVER}/settings')
                    .then((r) => 'OK ' + r.status)
                    .catch((e) => 'FAIL ' + e.message)
            `);
            console.log(`[probe] origin=${origin} streaming-server=${probe}`);

            // What the app itself concluded, which is what actually decides
            // whether a torrent can be played.
            setTimeout(async () => {
                const state = await mainWindow.webContents.executeJavaScript(`
                    JSON.stringify({
                        avisoDeServidorVisivel: document.body.innerText.toLowerCase().includes('streaming server') || document.body.innerText.toLowerCase().includes('servidor de streaming'),
                        urlDoServidorNoPerfil: (JSON.parse(localStorage.getItem('profile') || '{}').settings || {}).streamingServerUrl,
                        addons: (JSON.parse(localStorage.getItem('profile') || '{}').addons || []).map((a) => a.manifest.name)
                    })
                `);
                console.log(`[state] ${state}`);
            }, 12000);
        });
    }

    // Anything that is not the app itself belongs in the real browser.
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (!url.startsWith(origin)) shell.openExternal(url);
        return { action: 'deny' };
    });
};

// Two copies would fight over both ports, and the loser ends up without a
// streaming server while still looking perfectly fine.
if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow === null) return;
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    });

    app.whenReady().then(async () => {
        await startStreamingServer();
        createWindow();

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) createWindow();
        });
    });
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
    if (streamingServer !== null) streamingServer.kill();
});
