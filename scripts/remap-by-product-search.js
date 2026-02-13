import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ENT_PATH = path.resolve('./entities/products-data.json');
const BACKUP_PATH = path.resolve('./entities/products-data.json.remap.bak');
const IMG_DIR = path.resolve('./public/images/products');
const ARTIFACTS_DIR = path.resolve('./artifacts');
const ENV_PATH = path.resolve('./.env');

if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

function readEnvKey() {
    if (process.env.PIXABAY_API_KEY) return process.env.PIXABAY_API_KEY;
    if (fs.existsSync(ENV_PATH)) {
        const txt = fs.readFileSync(ENV_PATH, 'utf8');
        const m = txt.match(/PIXABAY_API_KEY\s*=\s*(.+)/);
        if (m) return m[1].trim();
    } else {
        // create placeholder .env
        fs.writeFileSync(ENV_PATH, 'PIXABAY_API_KEY=YOUR_PIXABAY_API_KEY_HERE\n', 'utf8');
        console.log('Wrote placeholder .env; set PIXABAY_API_KEY to enable Pixabay searches.');
    }
    return null;
}

const PIX_KEY = readEnvKey();

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithTimeout(url, opts = {}, timeout = 15000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try { const res = await fetch(url, { ...opts, signal: controller.signal }); clearTimeout(id); return res; }
    catch (e) { clearTimeout(id); throw e; }
}

async function searchPixabay(query, per_page = 10) {
    if (!PIX_KEY) return [];
    const url = `https://pixabay.com/api/?key=${encodeURIComponent(PIX_KEY)}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=${per_page}&safesearch=true`;
    try {
        const res = await fetchWithTimeout(url, { headers: { 'User-Agent': 'Node' } }, 15000);
        if (!res.ok) return [];
        const j = await res.json();
        return j.hits || [];
    } catch (e) { return []; }
}

function scorePixabayHit(hit, tokens) {
    let score = 0;
    const tags = (hit.tags || '').toLowerCase();
    for (const t of tokens) if (t && tags.includes(t)) score += 2;
    // prefer larger widths
    if ((hit.imageWidth || hit.webformatWidth || 0) >= 800) score += 1;
    // prefer photos with user likes/comments
    if ((hit.likes || 0) > 50) score += 1;
    return score;
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

async function downloadToFile(url, dest) {
    const res = await fetchWithTimeout(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' } }, 20000);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const ab = await res.arrayBuffer();
    fs.writeFileSync(dest, Buffer.from(ab));
}

function safeExtFromUrl(u) {
    const m = u.match(/\.(jpg|jpeg|png|webp)(?:\?|$)/i);
    return m ? m[0] : '.jpg';
}

function tokensForProduct(p) {
    const name = (p.name || '').toLowerCase();
    const brand = (p.brand || '').toLowerCase();
    const toks = new Set();
    name.split(/[\s\-\/,&]+/).forEach(t => { if (t.length > 2) toks.add(t); });
    brand.split(/[\s\-\/,&]+/).forEach(t => { if (t.length > 1) toks.add(t); });
    return Array.from(toks);
}

function pickBestPixabay(hits, tokens) {
    let best = null; let bestScore = -1;
    for (const h of hits) {
        const s = scorePixabayHit(h, tokens);
        if (s > bestScore) { bestScore = s; best = h; }
    }
    return best;
}

function shaForFile(p) { try { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); } catch (e) { return '' } }

async function main() {
    if (!fs.existsSync(ENT_PATH)) { console.error('Missing products file'); process.exit(1); }
    const products = JSON.parse(fs.readFileSync(ENT_PATH, 'utf8'));
    // backup
    fs.writeFileSync(BACKUP_PATH, JSON.stringify(products, null, 2), 'utf8');
    console.log('Backup written to', BACKUP_PATH);

    const mapping = [['id', 'query', 'chosen_source', 'chosen_url', 'filename', 'sha256', 'notes']];

    let idx = 0;
    const usedUrls = new Set();
    for (const row of mapping.slice(1)) if (row[3]) usedUrls.add(row[3]);
    const FORCE = process.env.FORCE_REMAP === '1' || process.argv.includes('--force');

    for (const p of products) {
        idx++;
        const id = p.id || `p${idx}`;
        const tokens = tokensForProduct(p);
        const queries = [];
        // build prioritized queries
        queries.push(p.name);
        if (p.brand) queries.push(`${p.brand} ${p.name}`);
        queries.push(`${p.name} packaging`);
        queries.push(`${p.name} product shot`);
        queries.push(`${p.name} bottle`);
        queries.push(`${p.name} label`);
        queries.push(`${p.name} ${p.brand} packaging`);
        queries.push(`${p.name} studio white background`);

        let chosen = null;
        let chosenSource = '';
        let chosenUrl = '';
        let notes = '';

        // Try Pixabay first
        if (PIX_KEY) {
            for (const q of queries) {
                try {
                    const hits = await searchPixabay(q, 10);
                    if (hits && hits.length) {
                        const best = pickBestPixabay(hits, tokens);
                        if (!chosen) {
                            // no candidate found: leave placeholder or existing
                            const existing = p.image_url || '';
                            if (!FORCE && existing && !existing.includes('placeholder')) {
                                mapping.push([id, queries[0], 'kept-existing', existing, extractFilename(existing), '', 'kept existing image']);
                                console.log(`Kept existing for ${id}`);
                            } else {
                                // create placeholder
                                const ph = `pp_placeholder_${id}.svg`;
                                const phPath = path.resolve(IMG_DIR, ph);
                                if (!fs.existsSync(phPath)) {
                                    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"800\" height=\"800\">\n<rect width=\"100%\" height=\"100%\" fill=\"#f5f4f2\"/>\n<text x=\"50%\" y=\"50%\" font-family=\"sans-serif\" font-size=\"32\" fill=\"#999\" dominant-baseline=\"middle\" text-anchor=\"middle\">No image for ${p.name}</text>\n</svg>`;
                                    fs.writeFileSync(phPath, svg, 'utf8');
                                }
                                p.image_url = `/images/products/${ph}?v=${Date.now()}`;
                                mapping.push([id, queries[0], 'placeholder', '', ph, '', 'no match']);
                                console.log(`Placeholder for ${id}`);
                            }
                        }
                        // pick first that contains a token
                        let sel = null;
                        for (const u of imgs) {
                            if (usedUrls.has(u)) continue; // avoid duplicates
                            const lu = u.toLowerCase();
                            let matches = 0;
                            for (const t of tokens) if (t && lu.includes(t)) matches++;
                            if (matches >= 1) { sel = u; break; }
                        }
                        // fallback to first unused image
                        if (!sel) {
                            for (const u of imgs) { if (!usedUrls.has(u)) { sel = u; break; } }
                        }
                        if (sel) { chosen = sel; chosenSource = 'pinterest'; chosenUrl = sel; notes = `pinterest query ${q}`; break; }
                    }
                } catch (e) { }
                await sleep(300);
            }
        }

        // If chosen, download and set local path
        let filename = '';
        if (chosen) {
            try {
                const ext = typeof chosen === 'string' ? safeExtFromUrl(chosen) : safeExtFromUrl(chosenUrl || '');
                const shortId = id.replace(/^p0*/, '');
                filename = `ppp${shortId}_best_${Math.random().toString(36).slice(2, 8)}${ext}`;
                const dest = path.resolve(IMG_DIR, filename);
                const urlToDl = typeof chosen === 'string' ? chosen : chosenUrl;
                await downloadToFile(urlToDl, dest);
                const sha = shaForFile(dest);
                // avoid duplicate downloads (same image used for multiple products)
                if ([...usedUrls].includes(urlToDl)) {
                    // duplicate; remove file and continue without assigning
                    try { fs.unlinkSync(dest); } catch (e) { }
                    mapping.push([id, queries[0], 'duplicate', urlToDl, '', '', 'duplicate image skipped']);
                    console.log(`Skipped duplicate image for ${id}`);
                    continue;
                }
                usedUrls.add(urlToDl);
                p.image_url = `/images/products/${filename}?v=${Date.now()}`;
                mapping.push([id, queries[0], chosenSource, urlToDl, filename, sha, notes]);
                console.log(`${id} -> ${filename} (${chosenSource})`);
            } catch (e) {
                notes = `download failed: ${e.message}`;
                mapping.push([id, queries[0], chosenSource, chosenUrl, '', '', notes]);
                console.error(`Failed to download for ${id}: ${e.message}`);
            }
        } else {
            // no candidate found: leave placeholder or existing
            const existing = p.image_url || '';
            if (existing && !existing.includes('placeholder')) {
                mapping.push([id, queries[0], 'kept-existing', existing, extractFilename(existing), '', 'kept existing image']);
                console.log(`Kept existing for ${id}`);
            } else {
                // create placeholder
                const ph = `pp_placeholder_${id}.svg`;
                const phPath = path.resolve(IMG_DIR, ph);
                if (!fs.existsSync(phPath)) {
                    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"800\" height=\"800\">\n<rect width=\"100%\" height=\"100%\" fill=\"#f5f4f2\"/>\n<text x=\"50%\" y=\"50%\" font-family=\"sans-serif\" font-size=\"32\" fill=\"#999\" dominant-baseline=\"middle\" text-anchor=\"middle\">No image for ${p.name}</text>\n</svg>`;
                    fs.writeFileSync(phPath, svg, 'utf8');
                }
                p.image_url = `/images/products/${ph}?v=${Date.now()}`;
                mapping.push([id, queries[0], 'placeholder', '', ph, '', 'no match']);
                console.log(`Placeholder for ${id}`);
            }
        }

        // small delay to be polite
        await sleep(250);
    }

    // write updated products file
    fs.writeFileSync(ENT_PATH, JSON.stringify(products, null, 2), 'utf8');
    // write mapping CSV
    const csv = mapping.map(r => r.map(c => '"' + String(c || '').replace(/"/g, '""') + '"').join(',')).join('\n');
    fs.writeFileSync(path.resolve(ARTIFACTS_DIR, 'remap-by-product-search.csv'), csv, 'utf8');
    console.log('Wrote remap CSV to', path.resolve(ARTIFACTS_DIR, 'remap-by-product-search.csv'));
}

function extractFilename(url) {
    const m = (url || '').match(/\/images\/products\/([^?]+)/);
    if (m) return m[1];
    const m2 = (url || '').match(/([^/]+\.(?:jpg|jpeg|png|webp|svg))(?:\?|$)/i);
    return m2 ? m2[1] : '';
}

main().catch(e => { console.error(e); process.exit(1); });
