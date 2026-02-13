// No markdown fence found to remove.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ENT = path.resolve('./entities/products-data.json');
const BACKUP = path.resolve('./entities/products-data.json.pinterest.bak');
const IMG_DIR = path.resolve('./public/images/products');
const ART = path.resolve('./artifacts');

if (!fs.existsSync(ART)) fs.mkdirSync(ART, { recursive: true });
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function fetchWithTimeout(url, opts = {}, timeout = 15000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try { const res = await fetch(url, { ...opts, signal: controller.signal }); clearTimeout(id); return res; } catch (e) { clearTimeout(id); throw e; }
}

async function searchPinterest(query) {
    const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
    try {
        const res = await fetchWithTimeout(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' } }, 15000);
        if (!res.ok) return [];
        const html = await res.text();
        const re = /https:\/\/i\.pinimg\.com\/[a-z0-9\-_/]+\.(?:jpg|jpeg|png|webp)/gi;
        const m = html.match(re) || [];
        return Array.from(new Set(m));
    } catch (e) { return []; }
}

function tokensFor(p) {
    const name = (p.name || '').toLowerCase();
    const brand = (p.brand || '').toLowerCase();
    const toks = new Set();
    name.split(/[\s\-\/,&]+/).forEach(t => { if (t.length > 2) toks.add(t); });
    brand.split(/[\s\-\/,&]+/).forEach(t => { if (t.length > 1) toks.add(t); });
    return Array.from(toks);
}

function safeExt(u) { const m = u.match(/\.(jpg|jpeg|png|webp)(?:\?|$)/i); return m ? m[0] : '.jpg'; }
function sha(p) { try { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); } catch (e) { return '' } }

async function download(url, dest) {
    const res = await fetchWithTimeout(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' } }, 20000);
    if (!res.ok) throw new Error('status ' + res.status);
    const ab = await res.arrayBuffer(); fs.writeFileSync(dest, Buffer.from(ab));
}

async function main() {
    if (!fs.existsSync(ENT)) { console.error('Missing products'); process.exit(1); }
    const products = JSON.parse(fs.readFileSync(ENT, 'utf8'));
    fs.writeFileSync(BACKUP, JSON.stringify(products, null, 2), 'utf8');
    console.log('Backup written to', BACKUP);

    const mapping = [['id', 'query', 'chosen_url', 'filename', 'sha', 'notes']];
    const used = new Set();
    const FORCE = process.argv.includes('--force') || process.env.FORCE_REMAP === '1';
    const SAMPLE_LIMIT = process.env.SAMPLE_LIMIT ? parseInt(process.env.SAMPLE_LIMIT, 10) : null;

    for (let idx = 0; idx < products.length; idx++) {
        if (SAMPLE_LIMIT && idx >= SAMPLE_LIMIT) break;
        const p = products[idx];
        const id = p.id || 'unknown';
        const toks = tokensFor(p);
        const queries = [];
        queries.push(p.name);
        if (p.brand) queries.push(`${p.brand} ${p.name}`);
        queries.push(`${p.name} packaging`, `${p.name} product shot`, `${p.name} label`, `${p.name} ${p.brand} packaging`, `${p.name} studio white background`);

        let chosen = null;
        let chosenUrl = '';

        for (const q of queries) {
            const imgs = await searchPinterest(q);
            if (!imgs.length) { await sleep(200); continue; }
            // prefer unused images with token matches
            const required = toks.length >= 2 ? 2 : 1;
            for (const u of imgs) {
                if (used.has(u)) continue;
                const lu = u.toLowerCase(); let matches = 0; for (const t of toks) if (t && lu.includes(t)) matches++;
                if (matches >= required) { chosen = u; break; }
            }
            if (!chosen) { for (const u of imgs) { if (used.has(u)) continue; let matches = 0; const lu = u.toLowerCase(); for (const t of toks) if (t && lu.includes(t)) matches++; if (matches >= 1) { chosen = u; break; } } }
            if (chosen) { chosenUrl = chosen; break; }
            await sleep(250);
        }

        if (chosenUrl) {
            try {
                const ext = safeExt(chosenUrl);
                const fname = `pp_pin_${id}_${Math.random().toString(36).slice(2, 8)}${ext}`;
                const dest = path.resolve(IMG_DIR, fname);
                await download(chosenUrl, dest);
                const stats = fs.statSync(dest);
                if (stats.size < 10 * 1024) { try { fs.unlinkSync(dest); } catch (e) { } mapping.push([id, '', chosenUrl, '', '', 'too small']); console.log('Too small, skipped', id); continue; }
                const h = sha(dest);
                used.add(chosenUrl);
                p.image_url = `/images/products/${fname}?v=${Date.now()}`;
                mapping.push([id, '', chosenUrl, fname, h, 'pinterest']);
                console.log(`${id} -> ${fname}`);
            } catch (e) { console.error('Download failed for', id, e.message); mapping.push([id, '', chosenUrl, '', '', `download failed: ${e.message}`]); }
        } else {
            if (!FORCE && p.image_url && !p.image_url.includes('placeholder')) { mapping.push([id, '', 'kept-existing', extractFilename(p.image_url), '', 'kept existing']); console.log('Kept existing for', id); }
            else {
                const ph = `pp_placeholder_${id}.svg`; const php = path.resolve(IMG_DIR, ph); if (!fs.existsSync(php)) { const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"800\" height=\"800\">\n<rect width=\"100%\" height=\"100%\" fill=\"#f5f4f2\"/>\n<text x=\"50%\" y=\"50%\" font-family=\"sans-serif\" font-size=\"32\" fill=\"#999\" dominant-baseline=\"middle\" text-anchor=\"middle\">No image for ${p.name}</text>\n</svg>`; fs.writeFileSync(php, svg, 'utf8'); }
                p.image_url = `/images/products/${ph}?v=${Date.now()}`; mapping.push([id, '', 'placeholder', ph, '', 'no match']); console.log('Placeholder for', id);
            }

            await sleep(200);
        }

        fs.writeFileSync(ENT, JSON.stringify(products, null, 2), 'utf8');
        const csv = mapping.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
        fs.writeFileSync(path.resolve(ART, 'remap-pinterest-only.csv'), csv, 'utf8');
        console.log('Wrote', path.resolve(ART, 'remap-pinterest-only.csv'));
    }

}

function extractFilename(url) { const m = (url || '').match(/\/images\/products\/([^?]+)/); if (m) return m[1]; const m2 = (url || '').match(/([^/]+\.(?:jpg|jpeg|png|webp|svg))(?:\?|$)/i); return m2 ? m2[1] : ''; }

main().catch((e) => { console.error(e); process.exit(1); });
