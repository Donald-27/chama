#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

const ARTIFACTS_DIR = path.resolve(__dirname, '../artifacts');
const IMAGES_DIR = path.resolve(__dirname, '../public/images/products');
const PRODUCTS_FILE = path.resolve(__dirname, '../entities/products-data.json');

function listRemapFiles() {
    return fs.readdirSync(ARTIFACTS_DIR)
        .filter(f => f.startsWith('remap-pinterest') && f.endsWith('.csv'))
        .map(f => path.join(ARTIFACTS_DIR, f));
}

function parseCsvLine(line) {
    const parts = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    return parts.map(p => p.replace(/^"|"$/g, '').trim());
}

function readRows() {
    const files = listRemapFiles();
    const rows = [];
    files.forEach(file => {
        const txt = fs.readFileSync(file, 'utf8');
        const lines = txt.split(/\r?\n/).filter(Boolean);
        lines.slice(1).forEach(l => {
            const cols = parseCsvLine(l);
            if (cols.length >= 3) {
                const id = cols[0];
                const provided_pin = cols[1] || '';
                const chosen_url = cols[2] || '';
                const filename = cols[3] || '';
                rows.push({ id, provided_pin, chosen_url, filename });
            }
        });
    });
    const map = new Map();
    rows.forEach(r => map.set(r.id, r));
    return Array.from(map.values());
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function downloadTo(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, res => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return downloadTo(res.headers.location, dest).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                file.close();
                try { fs.unlinkSync(dest); } catch (e) { }
                return reject(new Error('HTTP ' + res.statusCode));
            }
            res.pipe(file);
            file.on('finish', () => file.close(() => resolve()));
        }).on('error', err => {
            try { fs.unlinkSync(dest); } catch (e) { }
            reject(err);
        });
    });
}

function backupFile(src) {
    if (!fs.existsSync(src)) return null;
    const bakDir = path.join(ARTIFACTS_DIR, 'backups');
    ensureDir(bakDir);
    const base = path.basename(src);
    const dest = path.join(bakDir, base + '.' + Date.now());
    fs.copyFileSync(src, dest);
    return dest;
}

async function run({ sample = 0 } = {}) {
    ensureDir(IMAGES_DIR);
    const rows = readRows();
    console.log('Found', rows.length, 'remap rows');
    const toProcess = sample > 0 ? rows.slice(0, sample) : rows;

    backupFile(PRODUCTS_FILE);
    const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));

    for (const r of toProcess) {
        try {
            if (!r.chosen_url || r.chosen_url.toLowerCase() === 'placeholder') {
                console.log(r.id, 'skipped (no chosen_url)');
                continue;
            }
            let filename = r.filename;
            if (!filename) {
                const u = new URL(r.chosen_url);
                filename = path.basename(u.pathname);
            }
            const destPath = path.join(IMAGES_DIR, filename);
            if (fs.existsSync(destPath)) {
                const b = backupFile(destPath);
                if (b) console.log(r.id, 'backed up', destPath, '->', b);
            }
            console.log(r.id, 'downloading', r.chosen_url, '->', destPath);
            await downloadTo(r.chosen_url, destPath);
            const pidx = products.findIndex(p => p.id === r.id);
            if (pidx !== -1) {
                products[pidx].image_url = '/images/products/' + filename;
                console.log(r.id, 'updated products-data.json image_url');
            } else {
                console.log(r.id, 'no product entry found to update');
            }
        } catch (err) {
            console.error(r.id, 'download failed:', err.message);
        }
    }

    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
    console.log('Finished. products-data.json updated and original backed up in artifacts/backups');
}

const args = process.argv.slice(2);
let sample = 0;
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--sample' && args[i + 1]) { sample = parseInt(args[i + 1], 10) || 0; i++; }
}

run({ sample }).catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
});
