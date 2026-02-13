import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ENT = path.resolve('./entities/products-data.json');
const BACKUP = path.resolve('./entities/products-data.json.manual-pinterest-next50-fixed.bak');
const IMG_DIR = path.resolve('./public/images/products');
const ART = path.resolve('./artifacts');

if (!fs.existsSync(ART)) fs.mkdirSync(ART, { recursive: true });
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

// Pins (first 50 unique entries provided by user, mapped to p051..p100)
const pins = [
    'https://pin.it/6tb0laSEt', 'https://pin.it/4vzQmZTMB', 'https://pin.it/35YkfF3Gv', 'https://pin.it/7mV54Oe1Y', 'https://pin.it/58dR96GjO',
    'https://pin.it/7iHtvpLND', 'https://pin.it/7yt8u8ZFj', 'https://pin.it/7aaMEwSQK', 'https://pin.it/g2DoZjBn0', 'https://pin.it/ewF01mMv2',
    'https://pin.it/3GZqClBoj', 'https://pin.it/6vAQ0WdTz', 'https://pin.it/5qsgOqDMY', 'https://pin.it/35CgQJ84P', 'https://pin.it/3pFqLqER1',
    'https://pin.it/11TDlW7sZ', 'https://pin.it/2z2x8dGR0', 'https://pin.it/6qZTN2zTj', 'https://pin.it/2BzY57ypK', 'https://pin.it/1jXpCCfIp',
    'https://pin.it/4ehMfo6pc', 'https://pin.it/ZtNe7XHLr', 'https://pin.it/4FEw7FuYP', 'https://pin.it/1TjJTdaoJ', 'https://pin.it/3FR28kb2W',
    'https://pin.it/6jjEPwFyB', 'https://pin.it/3vXKqrr3H', 'https://pin.it/5gvPzvwAn', 'https://pin.it/6xvnd0kmH', 'https://pin.it/1renRJOAE',
    'https://pin.it/5D1bt6d9J', 'https://pin.it/2Jr85zAJ5', 'https://pin.it/65wMXCsAA', 'https://pin.it/46ajghPKT', 'https://pin.it/7awtoUvU0',
    'https://pin.it/40v4HQyXL', 'https://pin.it/3NlKaVOHO', 'https://pin.it/1vyvjDILB', 'https://pin.it/fBX8cEGOl', 'https://pin.it/OplOVWe91',
    'https://pin.it/4lyas3zOU', 'https://pin.it/1JjxJzId9', 'https://pin.it/781wGlY4D', 'https://pin.it/2FlwUokQc', 'https://pin.it/4eTPRyUFx'
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

    // target ids p051..p100
    const targets = Array.from({ length: 50 }, (_, i) => `p${String(51 + i).padStart(3, '0')}`);

    for (let i = 0; i < Math.min(pins.length, targets.length); i++) {
        const targetId = targets[i];
        const p = products.find(x => x.id === targetId);
        const pin = pins[i];
        if (!p) {
            console.warn('Product not found for', targetId);
            mapping.push([targetId, pin, '', '', '', 'product not found']);
            continue;
        }
        console.log('Processing', targetId, pin);
        const img = await resolvePinImage(pin);
        if (!img) {
            const ph = `pp_placeholder_${targetId}.svg`;
            const php = path.resolve(IMG_DIR, ph);
            if (!fs.existsSync(php)) fs.writeFileSync(php, `<?xml version="1.0" encoding="UTF-8"?><svg xmlns=\"http://www.w3.org/2000/svg\" width=800 height=800><rect width=\"100%\" height=\"100%\" fill=\"#f5f4f2\"/><text x=\"50%\" y=\"50%\" font-family=\"sans-serif\" font-size=\"32\" fill=\"#999\" dominant-baseline=\"middle\" text-anchor=\"middle\">No image for ${p.name}</text></svg>`, 'utf8');
            p.image_url = `/images/products/${ph}?v=${Date.now()}`;
            mapping.push([targetId, pin, '', ph, '', 'no match']);
            console.log('No image found for', targetId);
            continue;
        }
        try {
            const ext = safeExt(img);
            const fname = `pp_pin_${targetId}_${Math.random().toString(36).slice(2, 8)}${ext}`;
            const dest = path.resolve(IMG_DIR, fname);
            await download(img, dest);
            const h = sha(dest);
            p.image_url = `/images/products/${fname}?v=${Date.now()}`;
            mapping.push([targetId, pin, img, fname, h, 'pinterest']);
            console.log(targetId, '->', fname);
        } catch (e) {
            console.error('Download failed for', targetId, e.message);
            mapping.push([targetId, pin, img, '', '', `download failed: ${e.message}`]);
        }
        await new Promise(r => setTimeout(r, 200));
    }

    fs.writeFileSync(ENT, JSON.stringify(products, null, 2), 'utf8');
    const csv = mapping.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    fs.writeFileSync(path.resolve(ART, 'remap-pinterest-manual-next50-fixed.csv'), csv, 'utf8');
    console.log('Wrote', path.resolve(ART, 'remap-pinterest-manual-next50-fixed.csv'));
}

main().catch(e => { console.error(e); process.exit(1); });
