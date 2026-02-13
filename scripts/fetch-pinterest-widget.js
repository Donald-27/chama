import fs from 'fs';
import path from 'path';

const ENTITIES_PATH = path.resolve('./entities/products-data.json');
const IMG_DIR = path.resolve('./public/images/products');
const SKIP_IDS = new Set(['p001', 'p002', 'p003', 'p004']);

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// simple fetch with timeout
async function fetchWithTimeout(url, opts = {}, timeout = 15000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const res = await fetch(url, { ...opts, signal: controller.signal });
        clearTimeout(id);
        return res;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
}

function extractPinImg(html) {
    // Find first i.pinimg.com image URL
    const re = /https:\/\/i\.pinimg\.com\/[a-z0-9\-_/]+\.(?:jpg|jpeg|png|webp)/gi;
    const m = html.match(re);
    if (!m || m.length === 0) return null;
    return m[0];
}

function safeFilename(id, url) {
    const extMatch = url.match(/\.(jpg|jpeg|png|webp)(?:\?|$)/i);
    const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '.jpg';
    return `pp_pin_${id}_${Math.random().toString(36).slice(2, 8)}${ext}`;
}

function writePlaceholder() {
    ensureDir(IMG_DIR);
    const file = path.resolve(IMG_DIR, 'placeholder.svg');
    if (fs.existsSync(file)) return `/images/products/placeholder.svg`;
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">\n  <rect width="100%" height="100%" fill="#f3f4f6"/>\n  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Arial,Helvetica,sans-serif" font-size="28">No image available</text>\n</svg>`;
    fs.writeFileSync(file, svg, 'utf8');
    return `/images/products/placeholder.svg`;
}

async function downloadToFile(url, destPath) {
    const res = await fetchWithTimeout(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' } }, 20000);
    if (!res.ok) throw new Error(`Bad status ${res.status}`);
    const ab = await res.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(ab));
}

async function tryFetchPinImage(query) {
    // Use Pinterest search page and extract first image URL
    const searchUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
    try {
        const res = await fetchWithTimeout(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' } }, 15000);
        if (!res.ok) return null;
        const html = await res.text();
        const img = extractPinImg(html);
        return img;
    } catch (e) {
        return null;
    }
}

async function main() {
    ensureDir(IMG_DIR);
    const placeholder = writePlaceholder();

    if (!fs.existsSync(ENTITIES_PATH)) {
        console.error('products-data.json missing');
        process.exit(1);
    }
    const products = JSON.parse(fs.readFileSync(ENTITIES_PATH, 'utf8'));
    let replaced = 0, attempted = 0;

    for (const p of products) {
        if (SKIP_IDS.has(p.id)) continue; // leave first four alone

        attempted++;
        const q = `${p.name} ${p.brand || ''} product`;
        let imgUrl = await tryFetchPinImage(q);
        if (!imgUrl) {
            // backoff and try a second query
            await sleep(1000);
            imgUrl = await tryFetchPinImage(p.name || p.brand || p.category || 'hair product');
        }

        if (imgUrl) {
            try {
                const fname = safeFilename(p.id, imgUrl);
                const dest = path.resolve(IMG_DIR, fname);
                await downloadToFile(imgUrl, dest);
                p.image_url = `/images/products/${fname}`;
                replaced++;
                console.log(`Pinned ${p.id} -> ${fname}`);
            } catch (e) {
                console.error(`Download failed for ${p.id}: ${e.message}`);
                p.image_url = placeholder;
            }
        } else {
            console.log(`No Pinterest image for ${p.id}; using placeholder`);
            p.image_url = placeholder;
        }

        // polite delay
        await sleep(400);
    }

    fs.writeFileSync(ENTITIES_PATH, JSON.stringify(products, null, 2), 'utf8');
    console.log(`Completed Pinterest fetch: attempted=${attempted} replaced=${replaced}`);
}

main().catch(e => { console.error(e); process.exit(1); });
