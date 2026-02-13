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

function hashBuffer(buf) {
    return crypto.createHash('sha256').update(buf).digest('hex');
}

async function fetchBuffer(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
}

async function searchPixabay(query, per_page = 10) {
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

function tokenize(str) { return (str || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean); }

async function main() {
    const raw = fs.readFileSync(ENTITIES_PATH, 'utf8');
    const products = JSON.parse(raw);

    // Map current local image files to hashes
    const fileHashMap = new Map(); // filename -> hash
    const hashFiles = new Map(); // hash -> [filename]

    for (const f of fs.readdirSync(IMG_DIR)) {
        const p = path.resolve(IMG_DIR, f);
        const buf = fs.readFileSync(p);
        const h = hashBuffer(buf);
        fileHashMap.set(f, h);
        if (!hashFiles.has(h)) hashFiles.set(h, []);
        hashFiles.get(h).push(f);
    }

    // Map products to hashes (for local images)
    const hashProducts = new Map(); // hash -> [productIndex]
    const productIndexById = new Map();
    products.forEach((p, i) => productIndexById.set(p.id, i));

    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const local = localPathFromUrl(p.image_url);
        if (!local) continue;
        const fname = path.basename(local);
        const h = fileHashMap.get(fname);
        if (!h) continue;
        if (!hashProducts.has(h)) hashProducts.set(h, []);
        hashProducts.get(h).push(i);
    }

    // Find duplicates
    const duplicateGroups = [];
    for (const [h, idxs] of hashProducts.entries()) {
        if (idxs.length > 1) duplicateGroups.push({ hash: h, idxs, files: hashFiles.get(h) || [] });
    }

    console.log(`Found ${duplicateGroups.length} duplicate image groups`);
    let replacements = 0;

    // For each duplicate group, keep first, replace others
    for (const grp of duplicateGroups) {
        const [keeperIdx, ...others] = grp.idxs;
        for (const idx of others) {
            const p = products[idx];
            const baseQuery = [p.name, p.brand, p.category].filter(Boolean).join(' ');
            const queries = [`${baseQuery} product packaging`, `${p.name} ${p.brand} ${p.category}`, `${p.brand} ${p.category} bottle`, `${p.name} bottle`, `${p.category} product`];
            let found = false;
            const triedHashes = new Set();
            for (const q of queries) {
                const hits = await searchPixabay(q, 15);
                for (const h of hits) {
                    const url = h.largeImageURL || h.webformatURL;
                    if (!url) continue;
                    try {
                        const buf = await fetchBuffer(url);
                        const hh = hashBuffer(buf);
                        if (hashFiles.has(hh) || triedHashes.has(hh)) continue; // already used
                        // save unique
                        const ext = url.includes('.png') ? '.png' : '.jpg';
                        const filename = `pp${p.id}_uniq${Math.random().toString(36).slice(2, 8)}${ext}`;
                        const dest = path.resolve(IMG_DIR, filename);
                        fs.writeFileSync(dest, buf);
                        // update maps
                        hashFiles.set(hh, [filename]);
                        fileHashMap.set(filename, hh);
                        products[idx].image_url = `/images/products/${filename}`;
                        replacements++;
                        found = true;
                        console.log(`Replaced duplicate for ${p.id} with ${filename}`);
                        break;
                    } catch (err) {
                        // continue to next hit
                        continue;
                    }
                }
                if (found) break;
                await new Promise(r => setTimeout(r, 250));
            }
            if (!found) console.log(`No unique replacement found for ${p.id}`);
        }
    }

    fs.writeFileSync(ENTITIES_PATH, JSON.stringify(products, null, 2), 'utf8');
    console.log(`Replacements completed: ${replacements}`);
}

main().catch(e => { console.error(e); process.exit(1); });
