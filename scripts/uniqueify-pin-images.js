import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ENTITIES_PATH = path.resolve('./entities/products-data.json');
const IMG_DIR = path.resolve('./public/images/products');
const PLACEHOLDER = '/images/products/placeholder.svg';

function hashFile(p) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }
function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

async function fetchWithTimeout(url, opts = {}, timeout = 15000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try { const res = await fetch(url, { ...opts, signal: controller.signal }); clearTimeout(id); return res; }
    catch (e) { clearTimeout(id); throw e; }
}

function extractAllPinImg(html) {
    const re = /https:\/\/i\.pinimg\.com\/[a-z0-9\-_/]+\.(?:jpg|jpeg|png|webp)/gi;
    const m = html.match(re) || [];
    return Array.from(new Set(m));
}

async function searchPinImages(query, per_page = 1) {
    // Using Pinterest search page; returns multiple found images
    const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
    try {
        const res = await fetchWithTimeout(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' } }, 15000);
        if (!res.ok) return [];
        const html = await res.text();
        const imgs = extractAllPinImg(html);
        return imgs;
    } catch (e) { return []; }
}

async function downloadToFile(url, dest) {
    const res = await fetchWithTimeout(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' } }, 20000);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const ab = await res.arrayBuffer();
    fs.writeFileSync(dest, Buffer.from(ab));
}

function safeFilename(id, url) {
    const ext = (url.match(/\.(jpg|jpeg|png|webp)(?:\?|$)/i) || ['.jpg'])[0];
    return `pp_pin_${id}_${Math.random().toString(36).slice(2, 8)}${ext}`;
}

async function main() {
    ensureDir(IMG_DIR);
    if (!fs.existsSync(ENTITIES_PATH)) { console.error('missing products'); process.exit(1); }
    const products = JSON.parse(fs.readFileSync(ENTITIES_PATH, 'utf8'));

    // map current images to hashes
    const fileHash = new Map();
    const hashFiles = new Map();
    for (const f of fs.readdirSync(IMG_DIR)) {
        const p = path.resolve(IMG_DIR, f);
        if (!fs.statSync(p).isFile()) continue;
        try { const h = hashFile(p); fileHash.set(f, h); if (!hashFiles.has(h)) hashFiles.set(h, []); hashFiles.get(h).push(f); } catch (e) { }
    }

    // For each product (except the solved four), try to find a Pinterest image via search
    const skip = new Set(['p009', 'p029', 'p033', 'p103']); // IDs already handled
    let replacements = 0;

    for (const p of products) {
        if (!p || !p.id) continue;
        if (skip.has(p.id)) continue;
        const existingImage = p.image_url || null;
        try {
            const query = [p.name, p.brand, p.category].filter(Boolean).join(' ');
            const imgs = await searchPinImages(query, 5);
            let accepted = false;
            for (const img of imgs) {
                try {
                    const fname = safeFilename(p.id, img);
                    const dest = path.resolve(IMG_DIR, fname);
                    await downloadToFile(img, dest);
                    const newh = hashFile(dest);
                    if (hashFiles.has(newh)) {
                        // already used, remove and continue
                        fs.unlinkSync(dest);
                        continue;
                    }
                    // accept
                    if (!hashFiles.has(newh)) hashFiles.set(newh, []);
                    hashFiles.get(newh).push(fname);
                    fileHash.set(fname, newh);
                    p.image_url = `/images/products/${fname}?v=${Date.now()}`;
                    replacements++;
                    accepted = true;
                    console.log(`Pinned ${p.id} -> ${fname} (query='${query}')`);
                    break;
                } catch (e) {
                    continue;
                }
            }
            if (!accepted) {
                // If there is an existing non-placeholder image, keep it
                const hasExisting = existingImage && !existingImage.includes('pp_placeholder_') && !existingImage.includes('placeholder.svg');
                if (hasExisting) {
                    console.log(`Kept existing image for ${p.id}`);
                } else {
                    const ph = `pp_placeholder_${p.id}.svg`;
                    if (!fs.existsSync(path.resolve(IMG_DIR, ph))) {
                        const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"800\" height=\"800\">\n<rect width=\"100%\" height=\"100%\" fill=\"#f5f4f2\"/>\n<text x=\"50%\" y=\"50%\" font-family=\"sans-serif\" font-size=\"32\" fill=\"#999\" dominant-baseline=\"middle\" text-anchor=\"middle\">No image for ${p.name}</text>\n</svg>`;
                        fs.writeFileSync(path.resolve(IMG_DIR, ph), svg, 'utf8');
                    }
                    p.image_url = `/images/products/${ph}?v=${Date.now()}`;
                    console.log(`Placeholder for ${p.id}`);
                    replacements++;
                }
            }
            await new Promise(r => setTimeout(r, 250));
        } catch (e) {
            console.error(`Error processing ${p.id}: ${e.message}`);
            const hasExisting = existingImage && !existingImage.includes('pp_placeholder_') && !existingImage.includes('placeholder.svg');
            if (hasExisting) {
                console.log(`Kept existing image for ${p.id} after error`);
            } else {
                const ph = `pp_placeholder_${p.id}.svg`;
                if (!fs.existsSync(path.resolve(IMG_DIR, ph))) {
                    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"800\" height=\"800\">\n<rect width=\"100%\" height=\"100%\" fill=\"#f5f4f2\"/>\n<text x=\"50%\" y=\"50%\" font-family=\"sans-serif\" font-size=\"32\" fill=\"#999\" dominant-baseline=\"middle\" text-anchor=\"middle\">No image for ${p.name}</text>\n</svg>`;
                    fs.writeFileSync(path.resolve(IMG_DIR, ph), svg, 'utf8');
                }
                p.image_url = `/images/products/${ph}?v=${Date.now()}`;
            }
        }
    }

    fs.writeFileSync(ENTITIES_PATH, JSON.stringify(products, null, 2), 'utf8');
    console.log('Done. Replacements:', replacements);
}

main().catch(e => { console.error(e); process.exit(1); });
