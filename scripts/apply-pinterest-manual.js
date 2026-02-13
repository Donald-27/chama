import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ENT = path.resolve('./entities/products-data.json');
const BACKUP = path.resolve('./entities/products-data.json.manual-pinterest.bak');
const IMG_DIR = path.resolve('./public/images/products');
const ART = path.resolve('./artifacts');

if (!fs.existsSync(ART)) fs.mkdirSync(ART, { recursive: true });
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

const pins = [
    // Combined list from user; we'll map first 50 to products 1..50
    'https://pin.it/EqgdCDpeX', 'https://pin.it/2Ctd09TT7', 'https://pin.it/2ZJlmDRVJ', 'https://pin.it/6iX3LFG0H', 'https://pin.it/2cXFWa2b9', 'https://pin.it/7aI7OcykC', 'https://pin.it/4W1rBrIkY', 'https://pin.it/64KWhFR9m', 'https://pin.it/742251Jwk', 'https://pin.it/2wCHGUwa9',
    'https://pin.it/5nwfn4KVY', 'https://pin.it/5D6Hm6ghY', 'https://pin.it/ctSUbtpXH', 'https://pin.it/1ck0bRvJS', 'https://pin.it/560f2Z7ao', 'https://pin.it/6VlPs5YIO', 'https://pin.it/4uPp3bWd4', 'https://pin.it/35HrA7Uid', 'https://pin.it/6pizUtHm9', 'https://pin.it/4JdB2HRDT',
    'https://pin.it/6GAgiE7os', 'https://pin.it/1oCbeDeZo', 'https://pin.it/pBTy665UM', 'https://pin.it/5YSapqgDZ', 'https://pin.it/5eamkzFPR', 'https://pin.it/4sA1EKret', 'https://pin.it/46sNvYGlk', 'https://pin.it/7EdvE5lyW', 'https://pin.it/723tdKIFA', 'https://pin.it/4eKTSZn7w',
    'https://pin.it/62udAE3wM', 'https://pin.it/4hoFE7xQp', 'https://pin.it/2TSgEonoC', 'https://pin.it/5N5tAyORz', 'https://pin.it/6nDqobDek', 'https://pin.it/VRNklJ8Nu', 'https://pin.it/YKSQGgOqF', 'https://pin.it/V4YB2nng6', 'https://pin.it/1aSqn7V11', 'https://pin.it/3TxfFaDWb',
    'https://pin.it/33TSPn6Ir', 'https://pin.it/43mLI3QjS', 'https://pin.it/6WcjpTglJ', 'https://pin.it/3rPttTXlh', 'https://pin.it/11mGMsooG', 'https://pin.it/6FKRqICdj', 'https://pin.it/3WHvE57K9', 'https://pin.it/1zGeBxYDf', 'https://pin.it/3E7yCOUYw', 'https://pin.it/6x9DhAzet'
];

function safeExt(u) { const m = u.match(/\.(jpg|jpeg|png|webp)(?:\?|$)/i); return m ? m[0] : '.jpg'; }
function sha(p) { try { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); } catch (e) { return '' } }

async function fetchWithTimeout(url, opts = {}, timeout = 20000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try { const res = await fetch(url, { ...opts, signal: controller.signal }); clearTimeout(id); return res; } catch (e) { clearTimeout(id); throw e; }
}

async function resolvePinImage(pinUrl) {
    try {
        const res = await fetchWithTimeout(pinUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' } }, 20000);
        if (!res.ok) return null;
        const html = await res.text();
        const re = /https:\/\/i\.pinimg\.com\/[a-z0-9\-_/]+\.(?:jpg|jpeg|png|webp)/gi;
        const m = html.match(re) || [];
        return m.length ? m[0] : null;
    } catch (e) { return null; }
}

async function download(url, dest) {
    const res = await fetchWithTimeout(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' } }, 30000);
    if (!res.ok) throw new Error('status ' + res.status);
    const ab = await res.arrayBuffer(); fs.writeFileSync(dest, Buffer.from(ab));
}

async function main() {
    if (!fs.existsSync(ENT)) { console.error('Missing products file'); process.exit(1); }
    const products = JSON.parse(fs.readFileSync(ENT, 'utf8'));
    fs.writeFileSync(BACKUP, JSON.stringify(products, null, 2), 'utf8');
    console.log('Backup written to', BACKUP);

    const mapping = [['id', 'provided_pin', 'chosen_url', 'filename', 'sha', 'notes']];

    for (let i = 0; i < Math.min(50, pins.length); i++) {
        const p = products[i];
        const id = p.id || `p${i + 1}`;
        const pin = pins[i];
        console.log('Processing', id, pin);
        const img = await resolvePinImage(pin);
        if (!img) {
            // placeholder
            const ph = `pp_placeholder_${id}.svg`;
            const php = path.resolve(IMG_DIR, ph);
            if (!fs.existsSync(php)) fs.writeFileSync(php, `<?xml version="1.0" encoding="UTF-8"?><svg xmlns=\"http://www.w3.org/2000/svg\" width=800 height=800><rect width=\"100%\" height=\"100%\" fill=\"#f5f4f2\"/><text x=\"50%\" y=\"50%\" font-family=\"sans-serif\" font-size=\"32\" fill=\"#999\" dominant-baseline=\"middle\" text-anchor=\"middle\">No image for ${p.name}</text></svg>`, 'utf8');
            p.image_url = `/images/products/${ph}?v=${Date.now()}`;
            mapping.push([id, pin, '', ph, '', 'no match']);
            console.log('No image found for', id);
            continue;
        }
        try {
            const ext = safeExt(img);
            const fname = `pp_pin_${id}_${Math.random().toString(36).slice(2, 8)}${ext}`;
            const dest = path.resolve(IMG_DIR, fname);
            await download(img, dest);
            const h = sha(dest);
            p.image_url = `/images/products/${fname}?v=${Date.now()}`;
            mapping.push([id, pin, img, fname, h, 'pinterest']);
            console.log(id, '->', fname);
        } catch (e) {
            console.error('Download failed for', id, e.message);
            mapping.push([id, pin, img, '', '', `download failed: ${e.message}`]);
        }
        await new Promise(r => setTimeout(r, 200));
    }

    fs.writeFileSync(ENT, JSON.stringify(products, null, 2), 'utf8');
    const csv = mapping.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    fs.writeFileSync(path.resolve(ART, 'remap-pinterest-manual.csv'), csv, 'utf8');
    console.log('Wrote', path.resolve(ART, 'remap-pinterest-manual.csv'));
}

main().catch(e => { console.error(e); process.exit(1); });
