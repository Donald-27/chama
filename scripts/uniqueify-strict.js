import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const ENTITIES_PATH = path.resolve(__dirname, '../entities/products-data.json');
const IMG_DIR = path.resolve(__dirname, '../public/images/products');
const PIXABAY_KEY = process.env.PIXABAY_API_KEY || process.env.PIXABAY_KEY;

if (!PIXABAY_KEY) {
    console.error('PIXABAY_API_KEY not set. Export PIXABAY_API_KEY and re-run.');
    process.exit(1);
}

function hashBuffer(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

async function fetchBuffer(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
}

async function searchPixabay(query, per_page = 20) {
    const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=${per_page}&safesearch=true`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.hits || [];
}

function localPathFromUrl(url) {
    if (!url) return null;
    if (url.startsWith('/')) return path.resolve(__dirname, '..', url.slice(1));
    return null;
}

function tagsContainAny(hit, words) {
    if (!hit || !hit.tags) return false;
    const tags = hit.tags.toLowerCase();
    return words.some(w => tags.includes(w));
}

async function main() {
    const raw = fs.readFileSync(ENTITIES_PATH, 'utf8');
    const products = JSON.parse(raw);

    // compute hashes of existing files
    const fileHash = new Map(); // filename -> hash
    const hashFiles = new Map(); // hash -> [filename]
    for (const f of fs.readdirSync(IMG_DIR)) {
        const p = path.resolve(IMG_DIR, f);
        const buf = fs.readFileSync(p);
        const h = hashBuffer(buf);
        fileHash.set(f, h);
        if (!hashFiles.has(h)) hashFiles.set(h, []);
        hashFiles.get(h).push(f);
    }

    // map product idx to filenames and hashes
    const hashProducts = new Map();
    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const local = localPathFromUrl(p.image_url);
        if (!local) continue;
        const fname = path.basename(local);
        const h = fileHash.get(fname);
        if (!h) continue;
        if (!hashProducts.has(h)) hashProducts.set(h, []);
        hashProducts.get(h).push(i);
    }

    const duplicateGroups = [];
    for (const [h, idxs] of hashProducts.entries()) if (idxs.length > 1) duplicateGroups.push({ h, idxs, files: hashFiles.get(h) || [] });
    console.log(`Strict dedupe: ${duplicateGroups.length} duplicate groups found`);

    const requiredKeywords = ['product', 'packaging', 'bottle', 'label', 'box', 'package', 'sale', 'discount'];
    let replacements = 0;

    for (const grp of duplicateGroups) {
        // keep first product's image, replace others
        const [keeper, ...others] = grp.idxs;
        for (const idx of others) {
            const p = products[idx];
            const base = [p.name, p.brand, p.category].filter(Boolean).join(' ');
            let replaced = false;
            // try various stricter queries
            const queries = [
                `${base} product packaging`,
                `${base} product bottle`,
                `${p.name} ${p.brand} packaging`,
                `${p.brand} ${p.category} packaging`,
                `${p.name} product label`,
                `${p.name} ${p.brand} sale`,
                `${p.name} ${p.brand} packaging product`
            ];

            for (const q of queries) {
                const hits = await searchPixabay(q, 30);
                for (const hit of hits) {
                    // require tags include at least one required keyword
                    if (!tagsContainAny(hit, requiredKeywords)) continue;
                    const url = hit.largeImageURL || hit.webformatURL;
                    if (!url) continue;
                    try {
                        const buf = await fetchBuffer(url);
                        const hh = hashBuffer(buf);
                        if (hashFiles.has(hh)) continue; // already used
                        const ext = url.includes('.png') ? '.png' : '.jpg';
                        const fname = `ppp${p.id}_uniq2${Math.random().toString(36).slice(2, 8)}${ext}`;
                        const dest = path.resolve(IMG_DIR, fname);
                        fs.writeFileSync(dest, buf);
                        hashFiles.set(hh, [fname]);
                        fileHash.set(fname, hh);
                        products[idx].image_url = `/images/products/${fname}`;
                        replacements++;
                        replaced = true;
                        console.log(`Strict replaced ${p.id} -> ${fname}`);
                        break;
                    } catch (e) {
                        continue;
                    }
                }
                if (replaced) break;
                await new Promise(r => setTimeout(r, 250));
            }
            if (!replaced) console.log(`Strict: no suitable unique replacement for ${p.id}`);
        }
    }

    fs.writeFileSync(ENTITIES_PATH, JSON.stringify(products, null, 2), 'utf8');
    console.log(`Strict replacements: ${replacements}`);
}

main().catch(e => { console.error(e); process.exit(1); });
