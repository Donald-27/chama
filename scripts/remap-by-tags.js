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

function tokenize(str) { return (str || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean); }

async function searchPixabay(q, per_page = 30) {
    const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(q)}&image_type=photo&per_page=${per_page}&safesearch=true`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.hits || [];
}

function hashBuffer(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

async function fetchBuffer(url) { const res = await fetch(url); if (!res.ok) throw new Error(`fetch ${res.status}`); const ab = await res.arrayBuffer(); return Buffer.from(ab); }

function localPathFromUrl(url) { if (!url) return null; if (url.startsWith('/')) return path.resolve(__dirname, '..', url.slice(1)); return null; }

async function main() {
    const raw = fs.readFileSync(ENTITIES_PATH, 'utf8');
    const products = JSON.parse(raw);
    let replaced = 0;

    const required = ['product', 'packaging', 'bottle', 'label', 'box', 'package', 'sale', 'discount', 'pack'];

    for (const p of products) {
        const tokens = tokenize([p.name, p.brand, p.category].filter(Boolean).join(' '));
        const queries = [
            `${p.name} ${p.brand} product`,
            `${p.name} product packaging`,
            `${p.brand} ${p.category} product`,
            `${p.name} ${p.category} bottle`,
            `${p.name} product label`,
            `${p.category} product packaging`
        ];

        let found = false;
        for (const q of queries) {
            const hits = await searchPixabay(q, 40);
            for (const h of hits) {
                const tags = (h.tags || '').toLowerCase();
                // require either tag contains a token from product name/brand/category OR contains at least one required keyword
                const tokenMatch = tokens.some(t => t.length > 2 && tags.includes(t));
                const requiredMatch = required.some(r => tags.includes(r));
                if (!(tokenMatch || requiredMatch)) continue;
                const url = h.largeImageURL || h.webformatURL;
                if (!url) continue;
                try {
                    const buf = await fetchBuffer(url);
                    const hh = hashBuffer(buf);
                    const ext = url.includes('.png') ? '.png' : '.jpg';
                    const fname = `ppp${p.id}_remap_${Math.random().toString(36).slice(2, 8)}${ext}`;
                    const dest = path.resolve(IMG_DIR, fname);
                    fs.writeFileSync(dest, buf);
                    p.image_url = `/images/products/${fname}`;
                    replaced++;
                    found = true;
                    console.log(`Remapped ${p.id} -> ${fname} (query=${q})`);
                    break;
                } catch (e) { continue; }
            }
            if (found) break;
            await new Promise(r => setTimeout(r, 200));
        }
        if (!found) console.log(`No strict remap for ${p.id}`);
    }

    fs.writeFileSync(ENTITIES_PATH, JSON.stringify(products, null, 2), 'utf8');
    console.log(`Remap complete. Replaced: ${replaced}`);
}

main().catch(e => { console.error(e); process.exit(1); });
