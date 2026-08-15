// Copyright (C) 2017-2026 Smart code 203358507

// Rasterizes the Disclaw brand sources in assets/brand into every PNG/ICO the
// app and the PWA manifest need. Run with `node scripts/render-brand.js`.
// Requires Chrome — override the binary with the CHROME env variable.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ROOT = path.join(__dirname, '..');
const BRAND = path.join(ROOT, 'assets', 'brand');
const IMAGES = path.join(ROOT, 'assets', 'images');
const FAVICONS = path.join(ROOT, 'assets', 'favicons');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'disclaw-brand-'));

const fileUrl = (p) => 'file:///' + p.replace(/\\/g, '/');

const shoot = (url, width, height, out) => {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    execFileSync(CHROME, [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        '--default-background-color=00000000',
        `--window-size=${width},${height}`,
        `--screenshot=${out}`,
        url,
    ], { stdio: 'ignore' });
    if (!fs.existsSync(out)) throw new Error(`failed to render ${out}`);
    console.log(`${path.relative(ROOT, out)} ${width}x${height}`);
};

// An SVG document renders at its intrinsic size, so scale it through a wrapper.
const renderSvg = (svg, size, out) => {
    const wrapper = path.join(TMP, `wrap-${path.basename(svg, '.svg')}-${size}.html`);
    fs.writeFileSync(wrapper, `<style>html,body{margin:0;background:transparent}img{display:block;width:${size}px;height:${size}px}</style><img src="${fileUrl(path.join(BRAND, svg))}">`);
    shoot(fileUrl(wrapper), size, size, out);
};

// ICO container holding PNG frames — what every modern browser expects.
const buildIco = (pngs, out) => {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(pngs.length, 4);

    let offset = 6 + pngs.length * 16;
    const entries = pngs.map(({ size, data }) => {
        const entry = Buffer.alloc(16);
        entry.writeUInt8(size >= 256 ? 0 : size, 0);
        entry.writeUInt8(size >= 256 ? 0 : size, 1);
        entry.writeUInt8(0, 2);
        entry.writeUInt8(0, 3);
        entry.writeUInt16LE(1, 4);
        entry.writeUInt16LE(32, 6);
        entry.writeUInt32LE(data.length, 8);
        entry.writeUInt32LE(offset, 12);
        offset += data.length;
        return entry;
    });

    fs.writeFileSync(out, Buffer.concat([header, ...entries, ...pngs.map(({ data }) => data)]));
    console.log(`${path.relative(ROOT, out)} (${pngs.map(({ size }) => size).join(', ')})`);
};

// Symbol — navbar, player buffering, web update screen
renderSvg('symbol.svg', 256, path.join(IMAGES, 'disclaw_symbol.png'));

// PWA icons, purpose "any"
renderSvg('symbol.svg', 512, path.join(IMAGES, 'icon.png'));
renderSvg('symbol.svg', 512, path.join(IMAGES, 'icon_512x512.png'));
renderSvg('symbol.svg', 196, path.join(IMAGES, 'icon_196x196.png'));

// PWA icons, purpose "maskable" — backdrop plus safe-zone padding
renderSvg('maskable.svg', 512, path.join(IMAGES, 'maskable_icon.png'));
renderSvg('maskable.svg', 512, path.join(IMAGES, 'maskable_icon_512x512.png'));
renderSvg('maskable.svg', 196, path.join(IMAGES, 'maskable_icon_196x196.png'));

// Wordmark — intro/login screen
shoot(fileUrl(path.join(BRAND, 'wordmark.html')), 670, 195, path.join(IMAGES, 'logo.png'));

// Favicons
const icoSizes = [16, 32, 48, 64, 128, 256];
const frames = icoSizes.map((size) => {
    const png = path.join(TMP, `favicon-${size}.png`);
    renderSvg('symbol.svg', size, png);
    return { size, data: fs.readFileSync(png) };
});
buildIco(frames, path.join(FAVICONS, 'favicon.ico'));
buildIco(frames.filter(({ size }) => size === 256), path.join(FAVICONS, 'icon_256x256.ico'));

fs.rmSync(TMP, { recursive: true, force: true });
